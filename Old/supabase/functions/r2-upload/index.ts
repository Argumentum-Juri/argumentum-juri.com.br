import { serve } from "https://deno.land/std@0.168.0/http/server.ts"; // APENAS UMA IMPORTAÇÃO DE 'serve'
// Importar módulos Deno necessários de uma versão mais recente do std
import { toIMF } from "https://deno.land/std@0.224.0/datetime/mod.ts";
import { format } from "https://deno.land/std@0.224.0/datetime/format.ts";

console.log("R2 upload function (v11 - Manual SigV4 - Using Global Crypto) started");

// --- Configurações R2 ---
const R2_ACCOUNT_ID = Deno.env.get("R2_ACCOUNT_ID") || "";
const R2_ACCESS_KEY_ID = Deno.env.get("R2_ACCESS_KEY_ID") || "";
const R2_SECRET_ACCESS_KEY = Deno.env.get("R2_SECRET_ACCESS_KEY") || "";
const R2_BUCKET_NAME = Deno.env.get("R2_BUCKET_NAME") || "argumentum";
const R2_PUBLIC_URL_BASE = Deno.env.get("R2_PUBLIC_URL") || "";
const R2_REGION = "auto";
const R2_SERVICE = "s3";

// --- Validação Crítica ---
if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET_NAME) {
    console.error("FATAL: Missing required R2 environment variables!");
}

// --- Helpers SigV4 ---
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
interface FunctionResponse {
  success: boolean;
  key?: string;
  url?: string;
  error?: string;
  details?: string;
}

// Helper URL Pública
const getPublicR2Url = (key: string): string => {
    if (R2_PUBLIC_URL_BASE) {
        const cleanBase = R2_PUBLIC_URL_BASE.endsWith('/') ? R2_PUBLIC_URL_BASE.slice(0, -1) : R2_PUBLIC_URL_BASE;
        const cleanKey = key.startsWith('/') ? key.slice(1) : key;
        return `${cleanBase}/${cleanKey}`;
    }
    if (!R2_ACCOUNT_ID || !R2_BUCKET_NAME) return '';
    return `https://${R2_BUCKET_NAME}.${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${key}`;
};

// --- Handler Principal ---
// APENAS UMA CHAMADA 'serve'
serve(async (req) => {
  console.log(`Received ${req.method} request to ${req.url}`);

  // CORS Preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  // Validação Config Essencial
  if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET_NAME) {
      return new Response(JSON.stringify({ success: false, error: "Configuração do servidor R2 incompleta." } as FunctionResponse),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  // Apenas POST
  if (req.method !== "POST") {
     return new Response(JSON.stringify({ success: false, error: "Método não suportado" } as FunctionResponse),
        { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  // Processar FormData
  let file: File;
  let key: string;
  try {
       const contentType = req.headers.get("content-type");
       if (!contentType?.includes("multipart/form-data")) {
           throw new Error("Formato de conteúdo inválido. Esperado: multipart/form-data");
       }
       const formData = await req.formData();
       const fileValue = formData.get("file");
       const pathValue = formData.get("path");

       if (!(fileValue instanceof File)) throw new Error("Campo 'file' ausente ou não é um arquivo.");
       file = fileValue;

       if (typeof pathValue !== 'string' || !pathValue) throw new Error("Campo 'path' (R2 Key) ausente ou inválido.");
       key = pathValue;
       console.log(`Parsed formData: file=${file.name}, key=${key}`);
  } catch (formError) {
       console.error("Error parsing formData:", formError);
       return new Response(JSON.stringify({ success: false, error: `Erro ao processar formulário: ${formError.message}` } as FunctionResponse),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  // --- Upload para R2 com Assinatura Manual ---
  try {
    const bodyUint8 = new Uint8Array(await file.arrayBuffer());
    const host = `${R2_BUCKET_NAME}.${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
    const canonicalUri = `/${key}`;

    // 1. Data e Hora
    const now = new Date();
    const amzDate = format(now, "yyyyMMdd'T'HHmmss'Z'", { timeZone: "UTC" });
    const dateStamp = format(now, "yyyyMMdd", { timeZone: "UTC" });

    // 2. Hash do Payload
    const payloadHash = await hashSha256(bodyUint8);
    console.log("Payload hash:", payloadHash);

    // 3. Headers Canônicos
    const canonicalHeaders: Record<string, string> = {
        "content-length": String(file.size),
        "content-type": file.type || 'application/octet-stream',
        "host": host,
        "x-amz-content-sha256": payloadHash,
        "x-amz-date": amzDate,
    };
    const canonicalHeaderKeys = Object.keys(canonicalHeaders).sort();
    const canonicalHeadersStr = canonicalHeaderKeys.map(hKey => `${hKey.toLowerCase()}:${canonicalHeaders[hKey].trim()}`).join('\n') + '\n';
    const signedHeadersStr = canonicalHeaderKeys.map(hKey => hKey.toLowerCase()).join(';');
    console.log("Canonical Headers String:\n", canonicalHeadersStr);
    console.log("Signed Headers String:", signedHeadersStr);


    // 4. Requisição Canônica
    const canonicalRequest = `PUT\n${canonicalUri}\n\n${canonicalHeadersStr}\n${signedHeadersStr}\n${payloadHash}`;
    console.log("Canonical Request:\n", canonicalRequest);
    const canonicalRequestHash = await hashSha256(canonicalRequest);
    console.log("Canonical Request Hash:", canonicalRequestHash);

    // 5. String para Assinar
    const algorithm = "AWS4-HMAC-SHA256";
    const credentialScope = `${dateStamp}/${R2_REGION}/${R2_SERVICE}/aws4_request`;
    const stringToSign = `${algorithm}\n${amzDate}\n${credentialScope}\n${canonicalRequestHash}`;
    console.log("String-to-Sign:\n", stringToSign);

    // 6. Derivar Chave de Assinatura
    const signingKey = await getSignatureKey(R2_SECRET_ACCESS_KEY, dateStamp, R2_REGION, R2_SERVICE);

    // 7. Calcular Assinatura Final
    const signatureBytes = await hmacSha256(signingKey, stringToSign);
    const signatureHex = Array.from(signatureBytes).map(b => b.toString(16).padStart(2, '0')).join('');
    console.log("Signature:", signatureHex);

    // 8. Construir Cabeçalho Authorization
    const authorizationHeader = `${algorithm} Credential=${R2_ACCESS_KEY_ID}/${credentialScope}, SignedHeaders=${signedHeadersStr}, Signature=${signatureHex}`;

    // 9. Montar Headers Finais para o Fetch
    const finalHeaders = new Headers();
    for (const hKey of canonicalHeaderKeys) {
        finalHeaders.set(hKey, canonicalHeaders[hKey]);
    }
    finalHeaders.set("Authorization", authorizationHeader);

    // 10. Realizar o Fetch
    const requestUrl = `https://${host}${canonicalUri}`;
    console.log(`Sending PUT request to: ${requestUrl}`);

    const response = await fetch(requestUrl, {
        method: "PUT",
        headers: finalHeaders,
        body: bodyUint8
    });

    console.log(`R2 Response Status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("R2 upload failed. Response body:", errorBody);
      const errorCodeMatch = errorBody.match(/<Code>(.*?)<\/Code>/);
      const errorCode = errorCodeMatch ? errorCodeMatch[1] : response.statusText;
      throw new Error(`Falha no upload para R2: ${response.status} ${errorCode} - ${errorBody.substring(0, 200)}`);
    }

    console.log("Upload to R2 successful using manual SigV4.");

    const publicUrl = getPublicR2Url(key);

    const responseBody: FunctionResponse = {
      success: true,
      key: key,
      url: publicUrl,
    };

    return new Response(JSON.stringify(responseBody), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (uploadError: any) {
    console.error("Error during R2 upload/signing (Manual SigV4):", uploadError);
    return new Response(
      JSON.stringify({
        success: false,
        error: `Erro no upload (Manual SigV4): ${uploadError.message}`,
        details: uploadError.stack,
      } as FunctionResponse),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
// Fim do handler async (req)
}); // Fim da chamada serve