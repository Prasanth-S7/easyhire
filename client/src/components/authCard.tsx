import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "./ui/button";
import { useState } from "react";
import { NavLink } from "react-router-dom";
import { signIn } from "@/lib/auth-client";
import { BASE_URL } from "@/config/site.config";

export default function AuthCard({title, description, mode}: {
    title: string,
    description: string,
    mode: string,
}){

    const [googleLoading, setGoogleLoading] = useState(false);
    const [githubLoading, setGithubLoading] = useState(false);
    return(
        <Card className="max-w-md w-full rounded-none border-dashed shadow-none">
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid gap-4">
                    <div className="w-full flex flex-col gap-2 justify-between items-center">
                        <SignInButton
                            title="Sign in with Google"
                            provider="google"
                            loading={googleLoading}
                            callbackURL = {`${BASE_URL}/dashboard`} 
                            setLoading={setGoogleLoading}
                        />
                        <SignInButton
                            title="Sign in with Github"
                            provider="github"
                            loading={githubLoading}
                            callbackURL = {`${BASE_URL}/dashboard`} 
                            setLoading={setGithubLoading}
                        />
                    </div>
                </div>
            </CardContent>
            <CardFooter className="flex justify-center items-center border-t border-dashed">
                <p className="text-sm text-muted-foreground">
                    {
                        mode == "sign-in" ? (
                            <>
                                Don't have an account?{" "}
                                <NavLink to="/signup" className="font-semibold hover:underline">Sing Up</NavLink>
                            </>
                        ) : (
                            <>
                                Already have an account{" "}
                                <NavLink to="/signin" className="font-semibold hover:underline">Sign in</NavLink>
                            </>
                        )
                    }
                </p>
            </CardFooter>
        </Card>
    )
}

const SignInButton = ({
    title,
    provider,
    loading,
    setLoading,
    callbackURL
}: {
    title: string,
    provider: "google" | "github",
    loading: boolean,
    setLoading: (loading: boolean) => void;
    callbackURL: string, 
})=> {
    return(
        <Button
            className="w-full gap-2 border-dashed"
            variant="outline"
            size="lg"
            disabled={loading}
            onClick={async () => {
                await signIn.social(
                    {
                        provider: provider,
                        callbackURL: callbackURL,
                    },{
                        onRequest: (ctx) => {
                            setLoading(true)
                        }
                    }
                )
            }}
        >
            {title}
        </Button>
    )
}