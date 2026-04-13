import { useState } from "react"
import { Sidebar } from "./sidebar"
import { Navbar } from "./navbar"
import { CreatePost } from "./createPost"
import { PostsFeed } from "./postsFeed"
import { OrganizationPage } from "./organizationPage"
import { JobsPage } from "./jobsPage"

export function DashboardLayout(){
    const [refreshTrigger, setRefreshTrigger] = useState(0)
    const [activeTab, setActiveTab] = useState("dashboard")

    const handlePostCreated = () => {
        setRefreshTrigger(prev => prev + 1)
    }

    const renderContent = () => {
        switch (activeTab) {
            case "dashboard":
                return (
                    <div className="max-w-2xl mx-auto space-y-6">
                        <CreatePost onPostCreated={handlePostCreated} />
                        <PostsFeed refreshTrigger={refreshTrigger} />
                    </div>
                )
            case "organization":
                return <OrganizationPage />
            case "jobs":
                return <JobsPage />
            case "billing":
                return (
                    <div className="max-w-2xl mx-auto">
                        <div className="text-center text-muted-foreground py-12">
                            Billing page coming soon...
                        </div>
                    </div>
                )
            case "users":
                return (
                    <div className="max-w-2xl mx-auto">
                        <div className="text-center text-muted-foreground py-12">
                            Users page coming soon...
                        </div>
                    </div>
                )
            case "settings":
                return (
                    <div className="max-w-2xl mx-auto">
                        <div className="text-center text-muted-foreground py-12">
                            Settings page coming soon...
                        </div>
                    </div>
                )
            default:
                return null
        }
    }

    return(                 
        <div className="h-screen w-full overflow-hidden flex flex-col">
            <Navbar />
            <div className="flex h-full">
                <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
                <div className="flex-1 overflow-y-auto font-sans p-6">
                    {renderContent()}
                </div>
            </div>
        </div>
    )
}