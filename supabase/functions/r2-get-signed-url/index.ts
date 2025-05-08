import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { format } from "https://deno.land/std@0.224.0/datetime/format.ts";

console.log("R2 Get Signed URL function (v7 - Manual SigV4 - Final) started");

// --- Configurações R2 ---
const R2_ACCOUNT_ID = Deno.env.get("R2_ACCOUNT_ID") || "";
const R2_ACCESS_KEY_ID = Deno.env.get("R2_ACCESS_KEY_ID") || "";
const R2_SECRET_ACCESS_KEY = Deno.env.get("R2_SECRET_ACCESS_KEY") || "";
const R2_BUCKET_NAME = Deno.env.get("R2_BUCKET_NAME") || "argumentum";
const R2_REGION = "auto";
const R2_SERVICE = "s3";

// --- Validação Crítica ---
if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET_NAME) {
    console.error("FATAL: Missing required R2 environment variables!");
    // Opcional: Adicionar throw new Error(...) para impedir execução se faltar config.
}

// --- Helpers SigV4 (Definidos APENAS UMA VEZ aqui) ---
async function hmacSha256(key: Uint8Array, data: string): Promise<Uint8Array> {
    const cryptoKey = await crypto.subtle.importKey(
        "raw", key, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
    );
    const signature = await crypto.subtle.sign(
        "HMAC", cryptoKey, new TextEncoder().encode(data)
    );
    return new Uint8Array(signature);
}

async function hashSha256(data: string | Uint8Array): Promise<string> {
    const buffer = typeof data === 'string' ? new TextEncoder().encode(data) : data;
    const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
}

async function getSignatureKey(key: string, dateStamp: string, regionName: string, serviceName: string): Promise<Uint8Array> {
    const kDate = await hmacSha256(new TextEncoder().encode("AWS4" + key), dateStamp);
    const kRegion = await hmacSha256(kDate, regionName);
    const kService = await hmacSha256(kRegion, serviceName);
    const kSigning = await hmacSha256(kService, "aws4_request");
    return kSigning;
}

// --- Headers CORS ---
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// --- Interface de Resposta ---
interface SignedUrlResponse {
  success: boolean;
  signedUrl?: string;
  error?: string;
  details?: string;
}

// --- Handler Principal ---
serve(async (req) => {
  console.log(`Received ${req.method} request to ${req.url}`);

  // CORS Preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  // Validação Config Essencial
  if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET_NAME) {
      return new Response(JSON.stringify({ success: false, error: "Configuração do servidor R2 incompleta." } as SignedUrlResponse),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  // Apenas POST
  if (req.method !== "POST") {
     return new Response(JSON.stringify({ success: false, error: "Método não suportado. Use POST." } as SignedUrlResponse),
        { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  // Processar Corpo JSON
  let key: string;
  let filename: string;
  let expiresIn: number = 300;

  try {
    const body = await req.json();
    key = body.key;
    filename = body.filename || key.split('/').pop() || 'download';
    expiresIn = body.expiresIn || expiresIn;

    if (!key || typeof key !== 'string') {
      throw new Error("Parâmetro 'key' (R2 Key) ausente ou inválido no corpo da requisição JSON.");
    }
    key = key.startsWith('/') ? key.substring(1) : key; // Garante que não começa com /

    console.log(`Requesting signed URL for key: ${key}, filename: ${filename}, expires: ${expiresIn}s`);

  } catch (parseError) {
    console.error("Error parsing JSON body:", parseError);
    return new Response(JSON.stringify({ success: false, error: `Erro ao processar corpo da requisição: ${parseError.message}` } as SignedUrlResponse),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  // --- Geração da URL Assinada Manualmente ---
  try {
    const host = `${R2_BUCKET_NAME}.${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
    const canonicalUri = `/${key}`; // Começa com /

    // 1. Data e Hora e Scope
    const now = new Date();
    const amzDate = format(now, "yyyyMMdd'T'HHmmss'Z'", { timeZone: "UTC" });
    const dateStamp = format(now, "yyyyMMdd", { timeZone: "UTC" });
    const credentialScope = `${dateStamp}/${R2_REGION}/${R2_SERVICE}/aws4_request`;

    // 2. Montar Query Params Canônicos
    const queryParams = new URLSearchParams({
        "X-Amz-Algorithm": "AWS4-HMAC-SHA256",
        "X-Amz-Credential": `${R2_ACCESS_KEY_ID}/${credentialScope}`,
        "X-Amz-Date": amzDate,
        "X-Amz-Expires": String(expiresIn),
        "X-Amz-SignedHeaders": "host",
        "response-content-disposition": `attachment; filename="${encodeURIComponent(filename)}"`
    });
    queryParams.sort();
    const canonicalQueryString = queryParams.toString().replace(/\+/g, '%20'); // Espaços como %20

    // 3. Headers Canônicos
    const canonicalHeaders: Record<string, string> = { "host": host };
    const canonicalHeaderKeys = Object.keys(canonicalHeaders).sort();
    const canonicalHeadersStr = canonicalHeaderKeys.map(hKey => `${hKey.toLowerCase()}:${canonicalHeaders[hKey].trim()}`).join('\n') + '\n';
    const signedHeadersStr = canonicalHeaderKeys.map(hKey => hKey.toLowerCase()).join(';');

    // 4. Hash do Payload
    const payloadHash = 'UNSIGNED-PAYLOAD';

    // 5. Requisição Canônica
    const canonicalRequest = `GET\n${canonicalUri}\n${canonicalQueryString}\n${canonicalHeadersStr}\n${signedHeadersStr}\n${payloadHash}`;
    console.log("Canonical Request (for signing):\n", canonicalRequest);
    const canonicalRequestHash = await hashSha256(canonicalRequest);
    console.log("Canonical Request Hash:", canonicalRequestHash);

    // 6. String para Assinar
    const algorithm = "AWS4-HMAC-SHA256";
    const stringToSign = `${algorithm}\n${amzDate}\n${credentialScope}\n${canonicalRequestHash}`;
    console.log("String-to-Sign:\n", stringToSign);

    // 7. Derivar Chave de Assinatura
    const signingKey = await getSignatureKey(R2_SECRET_ACCESS_KEY, dateStamp, R2_REGION, R2_SERVICE);

    // 8. Calcular Assinatura Final
    const signatureBytes = await hmacSha256(signingKey, stringToSign);
    const signatureHex = Array.from(signatureBytes).map(b => b.toString(16).padStart(2, '0')).join('');
    console.log("Signature:", signatureHex);

    // 9. Montar URL Final Assinada
    const signedUrl = `https://${host}/${key}?${canonicalQueryString}&X-Amz-Signature=${signatureHex}`;
    console.log("Generated Signed URL:", signedUrl);

    // 10. Retornar sucesso com a URL
    const responseBody: SignedUrlResponse = { success: true, signedUrl: signedUrl };
    return new Response(JSON.stringify(responseBody), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200
    });

  } catch (signingError: any) {
    console.error("Error during manual SigV4 signing for GET URL:", signingError);
    return new Response(
      JSON.stringify({
        success: false,
        error: `Erro ao gerar URL assinada: ${signingError.message}`,
        details: signingError.stack,
      } as SignedUrlResponse),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
}); // Fim do serve