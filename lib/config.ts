// Base URL the server uses to call its own API routes. NEXTAUTH_URL is already required by NextAuth in production.
export const APP_URL = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

// Python NLU service (nlu/serve.py).
export const NLU_URL = process.env.NLU_URL ?? "http://localhost:8000";
