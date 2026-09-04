/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_EMPLOYEES_API_URL: string;
  readonly VITE_CHARACTERS_API_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
