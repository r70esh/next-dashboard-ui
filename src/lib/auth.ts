import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import connectToDB from "@/lib/db";
import { Admin, Teacher, Student, Parent } from "@/lib/models";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid credentials");
        }

        await connectToDB();

        const email = credentials.email;

        // Check Admin
        let user: any = await Admin.findOne({ email });
        let role = "admin";

        // Check Teacher
        if (!user) {
          user = await Teacher.findOne({ email });
          role = "teacher";
        }

        // Check Student
        if (!user) {
          user = await Student.findOne({ email });
          role = "student";
        }

        // Check Parent
        if (!user) {
          user = await Parent.findOne({ email });
          role = "parent";
        }

        if (!user) {
          throw new Error("User not found");
        }

        const isPasswordCorrect = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordCorrect) {
          throw new Error("Invalid credentials");
        }

        // Teachers who self-registered must be approved by an admin first.
        if (role === "teacher" && user.status === "pending") {
          throw new Error("PENDING_APPROVAL");
        }

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name || "Admin",
          role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        (session.user as any).role = token.role;
        (session.user as any).id = token.id;
      }
      return session;
    },
  },
  pages: {
    signIn: "/sign-in",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
