import AuthCard from "@/components/authCard"
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
export default function Signup(){
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
        <AuthCard title= "Sign up" description = "Sign up to your accound using your preferred provider" mode = "sign-up" />
    )
}