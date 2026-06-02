import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "@/lib/db";
import type { UserRole } from "@prisma/client";
import { authConfig } from "@/auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  secret: process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ account, profile }) {
      if (account?.provider === "google") {
        const email = profile?.email;
        if (!email) return false;

        const pendingRole = "PENDING" as UserRole;
        
        try {
          const existingUser = await prisma.user.findUnique({ where: { email } });
          
          if (existingUser) {
            // PENDING users cannot sign in yet
            if (existingUser.role === pendingRole) {
              return false;
            }

            // Approved users: update profile info and allow login
            await prisma.user.update({
              where: { email },
              data: {
                name: profile.name ?? undefined,
                image: profile.picture ?? undefined,
              },
            });

            return true;
          }

          // New user: create with PENDING role and reject sign-in
          const newUser = await prisma.user.create({
            data: {
              email,
              name: profile.name ?? null,
              image: profile.picture ?? null,
              role: pendingRole,
            },
          });

          console.log("✅ New user created with PENDING role:", newUser.email);

          // Return false to prevent sign-in, but account is saved
          return false;
        } catch (error) {
          console.error("❌ Error in signIn callback:", error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, account, profile }) {
      // On Google sign-in, load the user's id and role from the DB
      if (account?.provider === "google" && profile?.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: profile.email },
          select: { id: true, role: true },
        });
        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
      }
      return session;
    },
  },
});
