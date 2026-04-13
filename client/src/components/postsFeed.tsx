import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader } from "./ui/card"
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar"

interface Post {
  id: string
  content: string
  image?: string
  createdAt: string
  author: {
    id: string
    name: string
    image?: string
  }
}

interface PostsFeedProps {
  refreshTrigger?: number
}

export function PostsFeed({ refreshTrigger }: PostsFeedProps) {
  const [posts, setPosts] = useState<Post[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPosts = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("http://localhost:3000/api/posts", {
        credentials: "include",
      })

      if (response.ok) {
        const data = await response.json()
        setPosts(data)
      } else {
        setError("Failed to fetch posts")
      }
    } catch (err) {
      setError("Error fetching posts")
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchPosts()
  }, [refreshTrigger])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return "Just now"
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`
    
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    })
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="w-full animate-pulse">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-muted" />
                <div className="space-y-2">
                  <div className="h-4 w-24 bg-muted rounded" />
                  <div className="h-3 w-16 bg-muted rounded" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-4 w-full bg-muted rounded" />
                <div className="h-4 w-3/4 bg-muted rounded" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardContent className="py-8 text-center text-muted-foreground">
          {error}
        </CardContent>
      </Card>
    )
  }

  if (posts.length === 0) {
    return (
      <Card className="w-full">
        <CardContent className="py-8 text-center text-muted-foreground">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-12 mx-auto mb-4 opacity-50">
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
          </svg>
          <p className="font-medium">No posts yet</p>
          <p className="text-sm">Be the first to share something!</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => {
        const userInitials = post.author.name
          ?.split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase() || "U"

        return (
          <Card key={post.id} className="w-full">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={post.author.image || ""} alt={post.author.name} />
                  <AvatarFallback>{userInitials}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-sm">{post.author.name}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(post.createdAt)}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="whitespace-pre-wrap">{post.content}</p>
              {post.image && (
                <img 
                  src={`http://localhost:3000${post.image}`} 
                  alt="Post image" 
                  className="mt-4 rounded-lg max-h-96 object-cover w-full"
                />
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
