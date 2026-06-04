/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_API?: string;
  readonly VITE_NO_AUTH?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
