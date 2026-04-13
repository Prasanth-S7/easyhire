import AuthCard from "@/components/authCard"
import { useAuthRedirect } from "@/hooks/useAuthRedirect";

export default function Signin(){
    const {isPending, error } = useAuthRedirect();
    if(isPending){
        return (
            <div>Loading...</div>
        )
    }
    if(error){
        return(
            <div>Error...</div>
        )
    }
    return(
        <AuthCard title= "Sign in" description = "Sign in to your accound using your preferred provider" mode = "sign-in" />
    )
}