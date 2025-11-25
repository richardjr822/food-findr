import NextAuth, { type NextAuthOptions, type Session, type User, type Account, type Profile } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { validateUser, findUserByEmail, createUser } from "@/lib/auth";
import { logEvent, logSecurityEvent } from "@/lib/log";

// Export authOptions for API route usage (does not affect handler)
export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            return null;
          }
          const user = await validateUser(credentials.email, credentials.password);
          if (!user) {
            await logSecurityEvent("credentials_signin_failed", { email: credentials.email });
            return null;
          }
          const { passwordHash, ...safeUser } = user;
          await logEvent("info", "credentials_signin_success", { email: credentials.email });
          return safeUser as any;
        } catch {
          await logEvent("error", "credentials_signin_error", { email: credentials?.email });
          return null;
        }
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({
      user,
      account,
      profile,
    }: {
      user: User;
      account: Account | null;
      profile?: Profile;
    }) {
      if (account?.provider === "google") {
        // Check if user exists, if not, create
        let dbUser = await findUserByEmail(user.email as string);
        if (!dbUser) {
          const p = profile as any;
          dbUser = await createUser({
            firstName: p?.given_name || "",
            lastName: p?.family_name || "",
            email: user.email as string,
            password: "", // Not used for Google
            provider: "google",
            googleId: p?.sub,
          });
        }
        return true;
      }
      return true;
    },
    async session({
      session,
      token,
      user,
    }: {
      session: Session;
      token: any;
      user?: User;
    }) {
      // Attach database user id to the session for ownership checks
      (session.user as any).id = (token as any).uid || (token as any).sub || undefined;
      return session;
    },
    async jwt({
      token,
      user,
      account,
      profile,
    }: {
      token: any;
      user?: User;
      account?: Account | null;
      profile?: Profile;
    }) {
      // Ensure the JWT carries the database user id for later session hydration
      if (user?.email) {
        const dbUser = await findUserByEmail(user.email as string);
        if (dbUser?._id) {
          (token as any).uid = dbUser._id.toString();
        }
      }
      // Fallback: if uid missing but email present on token, resolve once
      if (!(token as any).uid && token?.email) {
        const dbUser = await findUserByEmail(token.email as string);
        if (dbUser?._id) {
          (token as any).uid = dbUser._id.toString();
        }
      }
      return token;
    },
  },
  events: {
    async signIn(message: any) {
      try {
        await logEvent("info", "nextauth_signin", { provider: message?.account?.provider, email: message?.user?.email });
      } catch {}
    },
    async signOut(message: any) {
      try {
        await logEvent("info", "nextauth_signout", { email: message?.token?.email });
      } catch {}
    },
    async session(message: any) {
      try {
        await logEvent("info", "nextauth_session", { uid: message?.token?.uid });
      } catch {}
    },
  },
  session: {
    strategy: "jwt" as const,
  },
  pages: {
    signIn: "/auth/login",
    error: "/auth/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

// Fix TS2323/TS2484: authOptions is already exported by its declaration above
export { handler as GET, handler as POST };