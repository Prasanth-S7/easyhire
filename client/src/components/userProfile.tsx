import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { authClient } from "@/lib/auth-client"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import { useNavigate } from "react-router-dom";
import { getCookie } from "@/lib/session";
import { signOut } from "@/lib/auth-client";
import { toast } from "sonner"

export function UserProfile(){
    const { data: session } = authClient.useSession();
    const user = session?.user;
    const navigate = useNavigate();
    return(
        <DropdownMenu>
            <DropdownMenuTrigger>
                <Avatar>
                    <AvatarImage src = {user?.image || user?.name.charAt(0)} alt="user" />
                    <AvatarFallback>CN</AvatarFallback>
                </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
                <DropdownMenuLabel>
                    <div className="flex flex-col">
                        <p className="font-medium leading-none">{user?.name}</p>
                        <p className="text-sm text-muted-foreground">{user?.email}</p>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick = {() => navigate("/dashboard")}>Dashboard</DropdownMenuItem>
                <DropdownMenuItem>Github</DropdownMenuItem>
                <DropdownMenuItem>X</DropdownMenuItem>
                <DropdownMenuItem className="text-red-500" onClick={async () => signOut({
                    fetchOptions: {
                        onRequest: () => {
                            toast.loading("Signing out...")
                        },
                        onSuccess: () => {
                            toast.success("Signed out successfully!")
                            toast.dismiss()
                            navigate("/")
                        }
                    }
                })}>Sign Out</DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}