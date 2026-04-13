import { siteConfig } from "@/config/site.config"
import { Button } from "./ui/button"
import { useTheme } from "./theme-provider"
import { ModeToggle } from "./toggleTheme"
import { UserProfile } from "./userProfile"
export function Navbar(){
    return(
        <div className="border-b border-dashed flex items-center justify-between h-[70px]">
            <div className="w-[300px] h-full md:border-r border-dashed text-center justify-center">
                <Button variant="ghost" className="w-full h-full font-sans font-bold">
                    {siteConfig.name}
                </Button>
            </div>
             <div className="flex-1 flex items-center justify-end h-full border-dashed divide-x">
                <Button variant="ghost" className="h-full border-l border-dashed px-8">
                    Github
                </Button>
                <Button variant="ghost" className="h-full" onClick={() => useTheme()}>
                    <ModeToggle />
                </Button>
                <Button variant="ghost" className="h-full ">
                    <UserProfile />
                </Button>
            </div>
        </div>
    )
}