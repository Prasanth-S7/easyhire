import { Outlet } from "react-router-dom"
export default function AuthLayout(){
    return(
        <div className="h-screen w-full flex items-center justify-center">
            <div className="hidden lg:block w-1/2 bg-black h-full">
                
            </div>
            <div className="w-full lg:w-1/2 flex items-center justify-center px-2 md:px-0 h-full">
                <Outlet />
            </div>
        </div>
    )
}
