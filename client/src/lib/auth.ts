import { betterAuth } from "better-auth";
import { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } from "@/config/site.config";
 
export const auth = betterAuth({
    socialProviders: {
        google: {
            prompt: "select_account",
            clientId: GOOGLE_CLIENT_ID,
            clientSecret: GOOGLE_CLIENT_SECRET
        },
    }
})