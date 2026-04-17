import { useState } from "react"
import { useSession } from "@/lib/auth-client"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import { Button } from "./ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { Sidebar } from "./sidebar"
import { Navbar } from "./navbar"
import { CreatePost } from "./createPost"
import { PostsFeed } from "./postsFeed"
import { OrganizationPage } from "./organizationPage"
import { JobsPage } from "./jobsPage"

const trendingHashtags = [
    { tag: "#Hiring", posts: "12.4K posts" },
    { tag: "#RemoteJobs", posts: "9.8K posts" },
    { tag: "#TechJobs", posts: "8.1K posts" },
    { tag: "#Frontend", posts: "6.7K posts" },
    { tag: "#JavaScript", posts: "5.9K posts" },
]

const suggestedPeople = [
    { name: "Product Hunt", role: "Hiring design talent" },
    { name: "React India", role: "Frontend communities" },
    { name: "Remote Works", role: "Distributed teams" },
]

function DashboardProfileColumn() {
    const { data: session } = useSession()
    const user = session?.user
    const userInitials =
        user?.name
            ?.split(" ")
            .map((part) => part[0])
            .join("")
            .toUpperCase() || "U"

    return (
        <div className="space-y-6 lg:sticky lg:top-6 lg:self-start">
            <Card className="overflow-hidden border-dashed">
                <div className="h-24 bg-gradient-to-r from-foreground/15 via-foreground/5 to-transparent" />
                <CardContent className="-mt-10 space-y-5 pb-6">
                    <div className="flex items-end justify-between gap-4">
                        <Avatar className="h-20 w-20 border-4 border-background shadow-sm">
                            <AvatarImage src={user?.image || ""} alt={user?.name || "User"} />
                            <AvatarFallback className="text-lg font-semibold">{userInitials}</AvatarFallback>
                        </Avatar>
                        <span className="rounded-full border border-dashed bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
                            Active
                        </span>
                    </div>
                    <div className="space-y-1">
                        <h2 className="text-xl font-semibold leading-none">{user?.name || "Your Profile"}</h2>
                        <p className="text-sm text-muted-foreground">{user?.email || "Update your profile to show more details."}</p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Keep your profile fresh so recruiters and people in your network can spot you quickly.
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-lg border border-dashed p-3 text-center">
                            <div className="text-lg font-semibold">128</div>
                            <div className="text-xs text-muted-foreground">Following</div>
                        </div>
                        <div className="rounded-lg border border-dashed p-3 text-center">
                            <div className="text-lg font-semibold">342</div>
                            <div className="text-xs text-muted-foreground">Followers</div>
                        </div>
                    </div>
                    <Button className="w-full" variant="secondary">
                        Edit Profile
                    </Button>
                </CardContent>
            </Card>

            <Card className="border-dashed">
                <CardHeader className="pb-3">
                    <CardTitle className="text-base">Who to follow</CardTitle>
                    <CardDescription>People and brands active in your feed.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {suggestedPeople.map((person) => (
                        <div key={person.name} className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                                <p className="truncate font-medium">{person.name}</p>
                                <p className="truncate text-xs text-muted-foreground">{person.role}</p>
                            </div>
                            <Button size="sm" variant="outline" className="shrink-0">
                                Follow
                            </Button>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
    )
}

function DashboardTrendingColumn() {
    return (
        <div className="lg:sticky lg:top-6 lg:self-start">
            <Card className="border-dashed">
                <CardHeader className="pb-4">
                    <CardTitle className="text-base">Trending hashtags</CardTitle>
                    <CardDescription>What the network is talking about right now.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {trendingHashtags.map((item) => (
                        <div key={item.tag} className="flex items-start justify-between gap-4 border-b border-dashed pb-4 last:border-b-0 last:pb-0">
                            <div>
                                <p className="font-medium">{item.tag}</p>
                                <p className="text-xs text-muted-foreground">{item.posts}</p>
                            </div>
                            <span className="text-muted-foreground">•••</span>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
    )
}

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
                    <div className="mx-auto h-full w-full max-w-7xl">
                        <div className="grid h-full min-h-0 gap-6 lg:grid-cols-[320px_minmax(0,1fr)_300px]">
                            <DashboardProfileColumn />

                            <div className="min-w-0 min-h-0 flex flex-col overflow-y-auto pr-1">
                                <div className="space-y-6 pb-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h2 className="text-base font-semibold">Share an update</h2>
                                            <p className="text-sm text-muted-foreground">Post a thought, a question, or a job lead.</p>
                                        </div>
                                    </div>
                                    <CreatePost onPostCreated={handlePostCreated} />
                                    <PostsFeed refreshTrigger={refreshTrigger} />
                                </div>
                            </div>

                            <DashboardTrendingColumn />
                        </div>
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
            <div className="flex h-full min-h-0">
                <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
                <div className="flex-1 overflow-hidden font-sans p-4 md:p-6 bg-background/40 min-h-0">
                    {renderContent()}
                </div>
            </div>
        </div>
    )
}
