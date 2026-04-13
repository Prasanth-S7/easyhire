import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from '@prisma/adapter-pg';
import { GOOGLE_CLIENT_ID } from "../config/config";
import { GOOGLE_CLIENT_SECRET } from "../config/config";


const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

export const prisma = new PrismaClient({ adapter });
 
export const auth = betterAuth({
    database: prismaAdapter(prisma, {
        provider: "postgresql",
    }),
    trustedOrigins:["http://localhost:5173"],
    socialProviders: {
        "google": {
            clientId: GOOGLE_CLIENT_ID ?? "",
            clientSecret: GOOGLE_CLIENT_SECRET ?? ""
        }
    }
})