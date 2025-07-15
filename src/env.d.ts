
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_API_ANON_KEY: string;
  readonly VITE_CF_ACCOUNT_ID: string;
  readonly VITE_CF_ACCESS_KEY_ID: string;
  readonly VITE_CF_SECRET_ACCESS_KEY: string;
  readonly VITE_CF_BUCKET_NAME: string;
  readonly VITE_CF_ENDPOINT: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
