declare global {
  namespace NodeJS {
    interface ProcessEnv {
      GOOGLE_SERVICE_ACCOUNT_KEY: string;
      RAKUTEN_API_KEY: string;
      NEXT_PUBLIC_APP_URL: string;
    }
  }
}

export {};