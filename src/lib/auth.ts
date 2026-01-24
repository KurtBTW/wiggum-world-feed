import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from './prisma';
import { compare } from 'bcryptjs';
import type { UserRole } from '@prisma/client';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: UserRole;
    };
  }

  interface User {
    role: UserRole;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: UserRole;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        console.log('[AUTH] Authorize called with email:', credentials?.email);
        
        if (!credentials?.email || !credentials?.password) {
          console.log('[AUTH] Missing credentials');
          throw new Error('Email and password required');
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        console.log('[AUTH] User found:', !!user, 'Has password:', !!user?.password);

        if (!user || !user.password) {
          console.log('[AUTH] No user or no password');
          throw new Error('Invalid email or password');
        }

        const isValid = await compare(credentials.password, user.password);
        console.log('[AUTH] Password valid:', isValid);

        if (!isValid) {
          console.log('[AUTH] Invalid password');
          throw new Error('Invalid email or password');
        }

        console.log('[AUTH] Success, returning user');
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
  },
};

export function hasRole(userRole: UserRole, requiredRole: UserRole): boolean {
  const roleHierarchy: Record<UserRole, number> = {
    APPLICANT: 0,
    MEMBER: 1,
    ADMIN: 2,
  };
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
}

export function isMember(role: UserRole): boolean {
  return hasRole(role, 'MEMBER');
}

export function isAdmin(role: UserRole): boolean {
  return role === 'ADMIN';
}
