import { useNavigate } from "react-router-dom"
import { useEffect } from "react";
import { authClient } from "@/lib/auth-client";

export function useAuthRedirect(){
    const navigate = useNavigate();
    const { data: session, isPending, error } = authClient.useSession();
    useEffect(() => {
        if(session) {
            navigate("/dashboard");
        }
    })
    return {isPending, error}
}