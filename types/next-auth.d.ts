import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    must_change_password?: boolean;
  }

  interface Session {
    user: {
      id: string;
      mustChangePassword: boolean;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    mustChangePassword?: boolean;
  }
}
