import { Outlet } from "react-router-dom"
export default function AuthLayout(){
    return(
        <div className="h-screen w-full flex items-center justify-center">
            <div className="hidden lg:flex w-1/2 bg-black h-full items-center justify-center">
                <img
                    src="/hero.png"
                    alt="Glowing abstract EasyHire visual"
                    className="relative z-10 w-full max-w-[760px] object-contain drop-shadow-[0_0_40px_rgba(131,255,86,0.08)]"
                />
            </div>
            <div className="w-full lg:w-1/2 flex items-center justify-center px-2 md:px-0 h-full">
                <Outlet />
            </div>
        </div>
    )
}
