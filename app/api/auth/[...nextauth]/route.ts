import NextAuth, { type NextAuthOptions, type Session, type User, type Account, type Profile } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { validateUser, findUserByEmail, createUser } from "@/lib/auth";

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
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required.");
        }
        const user = await validateUser(credentials.email, credentials.password);
        if (!user) {
          throw new Error("Invalid email or password.");
        }
        const { passwordHash, ...safeUser } = user;
        return safeUser as any;
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
      // Attach user info to session if needed
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
      // Attach user info to JWT if needed
      return token;
    },
  },
  session: {
    strategy: "jwt" as const,
  },
  pages: {
    signIn: "/auth/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

// Fix TS2323/TS2484: authOptions is already exported by its declaration above
export { handler as GET, handler as POST };