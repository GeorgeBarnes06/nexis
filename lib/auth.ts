import GoogleProvider from "next-auth/providers/google";
import type { NextAuthOptions } from "next-auth";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "openid email profile https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/tasks",
          access_type: "offline",
          prompt: "consent"
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      if (account) { // first sign in
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.expiresAt = account.expires_at;
        return token;

      } else if (Math.floor(Date.now() / 1000) < (token.expiresAt as number)) { //every subsequent request - check if token is still valid
        return token;

      } else { //not valid access token anymore
        if (!token.refreshToken) {
          console.error("Token refresh failed: no refresh token available on stored session");
          return { ...token, error: "RefreshAccessTokenError" };
        }

        try {
          const res = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
              client_id: process.env.GOOGLE_CLIENT_ID!,
              client_secret: process.env.GOOGLE_CLIENT_SECRET!,
              grant_type: "refresh_token",
              refresh_token: token.refreshToken as string,
            }),
          });

          const refreshed = await res.json();

          if (!res.ok || refreshed.error) {
            console.error("Token refresh failed:", refreshed);
            return { ...token, error: "RefreshAccessTokenError" };
          }

          return {
            ...token,
            accessToken: refreshed.access_token,
            expiresAt: Math.floor(Date.now() / 1000) + refreshed.expires_in,
            // Google doesn't always return a new refresh_token on refresh — keep the old one if absent
            refreshToken: refreshed.refresh_token ?? token.refreshToken,
          };
        } catch (err) {
          console.error("Token refresh request threw:", err);
          return { ...token, error: "RefreshAccessTokenError" };
        }
      }
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string;
      session.error = token.error as string | undefined;
      return session;
    },
  },
};