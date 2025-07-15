
// Create the team-invite-email edge function
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@1.0.0";

// CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TeamInviteEmailPayload {
  email: string;
  teamId: string;
  role: string;
  inviterId?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create a Supabase client with the Auth context of the function
    const supabaseClient = createClient(
      // Supabase API URL - env var exported by default.
      Deno.env.get('SUPABASE_URL') ?? '',
      // Supabase API ANON KEY - env var exported by default.
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      // Create client with Auth context of the user that called the function.
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );
    
    // Parse the request body
    const { email, teamId, role, inviterId } = await req.json() as TeamInviteEmailPayload;
    
    if (!email || !teamId || !role) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log(`Processing invite email for: ${email}, team: ${teamId}, role: ${role}`);
    
    // Get team information
    const { data: teamData, error: teamError } = await supabaseClient
      .from('teams')
      .select('*')
      .eq('id', teamId)
      .single();
      
    if (teamError) {
      console.error('Error fetching team:', teamError);
      throw teamError;
    }
    
    // Get inviter information if provided
    let inviterName = 'A team administrator';
    
    if (inviterId) {
      const { data: inviterData, error: inviterError } = await supabaseClient
        .from('profiles')
        .select('name, email')
        .eq('id', inviterId)
        .single();
        
      if (!inviterError && inviterData) {
        inviterName = inviterData.name || inviterData.email || 'A team administrator';
      }
    }

    // Generate an invite token
    const { data: inviteData, error: inviteError } = await supabaseClient
      .from('team_invites')
      .select('id')
      .eq('email', email)
      .eq('team_id', teamId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (inviteError && inviteError.code !== 'PGRST116') {
      console.error('Error fetching invite:', inviteError);
      throw inviteError;
    }

    const inviteId = inviteData?.id;
    if (!inviteId) {
      throw new Error('No valid invitation found');
    }
    
    // Create the signup link with invite token
    // Use SITE_URL from environment variables for production support
    const siteUrl = Deno.env.get('SITE_URL') || 'https://app.escribaai.com';
    const signupUrl = new URL(`${siteUrl}/auth`);
    signupUrl.searchParams.append('invite', inviteId);
    signupUrl.searchParams.append('email', email);
    
    // Initialize Resend if API key is available
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    
    if (resendApiKey) {
      const resend = new Resend(resendApiKey);
      
      // Send the actual email using Resend
      const { data: emailData, error: emailError } = await resend.emails.send({
        from: 'EscribaAI <noreply@escribaai.com>',
        to: [email],
        subject: 'Convite para participar de uma equipe no EscribaAI',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #333;">Convite para equipe EscribaAI</h1>
            <p>${inviterName} convidou você para participar de uma equipe no EscribaAI com a função de <strong>${role}</strong>.</p>
            <p>Clique no botão abaixo para se cadastrar e aceitar o convite:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${signupUrl.toString()}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Aceitar Convite</a>
            </div>
            <p>Ou copie e cole este link no seu navegador:</p>
            <p style="word-break: break-all; color: #4F46E5;">${signupUrl.toString()}</p>
            <p>Este convite expirará em 7 dias.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
            <p style="color: #666; font-size: 12px;">EscribaAI &copy; 2025</p>
          </div>
        `,
      });
      
      if (emailError) {
        console.error('Error sending email:', emailError);
        throw emailError;
      }
      
      console.log('Email sent successfully:', emailData);
      
      return new Response(
        JSON.stringify({ success: true, message: 'Invitation email sent successfully' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      // Log what would be sent if Resend API key is not available
      console.log(`
        Would send email to: ${email}
        Subject: Convite para participar de uma equipe no EscribaAI
        
        Body:
        ${inviterName} convidou você para participar de uma equipe no EscribaAI como ${role}.
        
        Clique no link abaixo para criar sua conta e aceitar o convite:
        ${signupUrl.toString()}
        
        Este convite expirará em 7 dias.
      `);
      
      return new Response(
        JSON.stringify({ success: true, message: 'Invitation email processed (development mode)' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('Error processing team invite email:', error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
