/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ENABLE_STRICT_MODE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
