import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { validateUser, findUserByEmail, createUser } from "@/lib/auth";

const handler = NextAuth({
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
    async signIn({ user, account, profile }) {
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
    async session({ session, token, user }) {
      // Attach user info to session if needed
      return session;
    },
    async jwt({ token, user, account, profile }) {
      // Attach user info to JWT if needed
      return token;
    },
  },
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };