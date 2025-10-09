import { UserRole } from "@prisma/client"
import NextAuth, { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: UserRole
      organizationId: string
    } & DefaultSession["user"]
  }

  interface User {
    id: string
    role: UserRole
    organizationId: string
    organization?: any
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    role: UserRole
    organizationId: string
  }
}
