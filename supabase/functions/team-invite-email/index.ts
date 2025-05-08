
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { SMTPClient } from "https://deno.land/x/denomailer@1.0.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper logging function for debugging
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[TEAM-INVITE-EMAIL] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");
    
    const requestData = await req.json();
    const { inviteId, email, teamName, inviterName, role } = requestData;
    
    if (!inviteId || !email || !teamName) {
      throw new Error("Dados do convite incompletos");
    }
    
    logStep("Invite data validated", { inviteId, email, teamName, inviterName, role });
    
    // Configuração SMTP
    const smtpUsername = Deno.env.get("SMTP_USERNAME");
    const smtpPassword = Deno.env.get("SMTP_PASSWORD");
    const smtpHost = Deno.env.get("SMTP_HOST");
    const smtpPort = parseInt(Deno.env.get("SMTP_PORT") || "587");
    
    if (!smtpUsername || !smtpPassword || !smtpHost) {
      throw new Error("Configuração SMTP incompleta");
    }
    
    logStep("SMTP configuration validated");
    
    // Montar URL de convite
    const baseUrl = Deno.env.get("FRONTEND_URL") || "http://localhost:5173";
    const inviteUrl = `${baseUrl}/auth?invite=${inviteId}`;
    
    logStep("Invite URL created", { inviteUrl });
    
    // Configurar cliente SMTP
    const client = new SMTPClient({
      connection: {
        hostname: smtpHost,
        port: smtpPort,
        tls: true,
        auth: {
          username: smtpUsername,
          password: smtpPassword,
        },
      },
    });
    
    // Criar HTML do email
    const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #0F3E73; color: white; padding: 15px; text-align: center; }
        .content { padding: 20px; background-color: #f9f9f9; }
        .button { display: inline-block; padding: 10px 20px; background-color: #BB9C45; color: white; 
          text-decoration: none; border-radius: 5px; font-weight: bold; }
        .footer { text-align: center; padding: 15px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>Convite para Equipe no Argumentum</h2>
        </div>
        <div class="content">
          <p>Olá,</p>
          <p>Você foi convidado por <strong>${inviterName || 'um membro'}</strong> para juntar-se à equipe <strong>${teamName}</strong> como <strong>${role || 'membro'}</strong> na plataforma Argumentum.</p>
          <p>Argumentum é uma plataforma que permite a criação e gestão colaborativa de petições jurídicas.</p>
          <p style="text-align: center; margin: 25px 0;">
            <a href="${inviteUrl}" class="button">Aceitar Convite</a>
          </p>
          <p>Se você ainda não possui uma conta, será direcionado para criar uma após aceitar o convite.</p>
          <p>Se você não esperava este convite, pode ignorar este email.</p>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} Argumentum - Todos os direitos reservados.
        </div>
      </div>
    </body>
    </html>
    `;
    
    // Enviar email
    await client.send({
      from: smtpUsername,
      to: email,
      subject: `Convite para Equipe: ${teamName}`,
      content: "Você foi convidado para uma equipe no Argumentum",
      html: emailHtml,
    });
    
    logStep("Email sent successfully");
    
    await client.close();
    
    // Atualizar o banco de dados para registrar que o email foi enviado
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
    );
    
    const { error: updateError } = await supabaseClient
      .from("team_invites")
      .update({ email_sent: true, email_sent_at: new Date().toISOString() })
      .eq("id", inviteId);
    
    if (updateError) {
      console.error("Error updating invite record:", updateError);
    }
    
    logStep("Database updated");
    
    return new Response(
      JSON.stringify({ success: true, message: "Email de convite enviado com sucesso" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
    
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("Error:", errorMsg);
    
    return new Response(
      JSON.stringify({ success: false, error: errorMsg }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
