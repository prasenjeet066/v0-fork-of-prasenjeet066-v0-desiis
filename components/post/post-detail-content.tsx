"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase/client"
import { PostCard } from "@/components/dashboard/post-card"
import { CreatePost } from "@/components/dashboard/create-post"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Loader2 } from "lucide-react"

interface PostDetailContentProps {
  postId: string
  userId: string
}

export function PostDetailContent({ postId, userId }: PostDetailContentProps) {
  const [post, setPost] = useState<any>(null)
  const [replies, setReplies] = useState<any[]>([])
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetchCurrentUser()
    fetchPostAndReplies()
  }, [postId, userId])

  const fetchCurrentUser = async () => {
    try {
      const { data } = await supabase.from("profiles").select("*").eq("id", userId).single()
      setCurrentUser(data)
    } catch (error) {
      console.error("Error fetching current user:", error)
    }
  }

  const fetchPostAndReplies = async () => {
    try {
      setIsLoading(true)

      // Fetch main post with profile data
      const { data: postData, error: postError } = await supabase
        .from("posts")
        .select(`
          *,
          profiles!posts_user_id_fkey(username, display_name, avatar_url, is_verified)
        `)
        .eq("id", postId)
        .single()

      if (postError) {
        console.error("Post fetch error:", postError)
        setPost(null)
        setIsLoading(false)
        return
      }

      // Fetch likes for the post
      const { data: likesData } = await supabase.from("likes").select("user_id").eq("post_id", postId)

      // Fetch reposts for the post
      const { data: repostsData } = await supabase.from("reposts").select("user_id").eq("post_id", postId)

      // Fetch replies count
      const { data: repliesCount } = await supabase.from("posts").select("id").eq("reply_to", postId)

      // Transform post data
      const transformedPost = {
        ...postData,
        username: postData.profiles?.username || "unknown",
        display_name: postData.profiles?.display_name || "Unknown User",
        avatar_url: postData.profiles?.avatar_url,
        is_verified: postData.profiles?.is_verified || false,
        likes_count: likesData?.length || 0,
        is_liked: likesData?.some((like: any) => like.user_id === userId) || false,
        reposts_count: repostsData?.length || 0,
        is_reposted: repostsData?.some((repost: any) => repost.user_id === userId) || false,
        replies_count: repliesCount?.length || 0,
        is_repost: false,
      }

      setPost(transformedPost)

      // Fetch replies
      const { data: repliesData, error: repliesError } = await supabase
        .from("posts")
        .select(`
          *,
          profiles!posts_user_id_fkey(username, display_name, avatar_url, is_verified)
        `)
        .eq("reply_to", postId)
        .order("created_at", { ascending: true })

      if (repliesError) {
        console.error("Replies fetch error:", repliesError)
        setReplies([])
        return
      }

      // Transform replies data
      const transformedReplies = await Promise.all(
        (repliesData || []).map(async (reply: any) => {
          // Fetch likes for each reply
          const { data: replyLikes } = await supabase.from("likes").select("user_id").eq("post_id", reply.id)

          // Fetch reposts for each reply
          const { data: replyReposts } = await supabase.from("reposts").select("user_id").eq("post_id", reply.id)

          return {
            ...reply,
            username: reply.profiles?.username || "unknown",
            display_name: reply.profiles?.display_name || "Unknown User",
            avatar_url: reply.profiles?.avatar_url,
            is_verified: reply.profiles?.is_verified || false,
            likes_count: replyLikes?.length || 0,
            is_liked: replyLikes?.some((like: any) => like.user_id === userId) || false,
            reposts_count: replyReposts?.length || 0,
            is_reposted: replyReposts?.some((repost: any) => repost.user_id === userId) || false,
            replies_count: 0,
            is_repost: false,
          }
        }),
      )

      setReplies(transformedReplies)
    } catch (error) {
      console.error("Error fetching post and replies:", error)
      setPost(null)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLike = async (postId: string, isLiked: boolean) => {
    try {
      if (isLiked) {
        await supabase.from("likes").delete().eq("post_id", postId).eq("user_id", userId)
      } else {
        await supabase.from("likes").insert({ post_id: postId, user_id: userId })
      }
      fetchPostAndReplies()
    } catch (error) {
      console.error("Error toggling like:", error)
    }
  }

  const handleRepost = async (postId: string, isReposted: boolean) => {
    try {
      if (isReposted) {
        await supabase.from("reposts").delete().eq("post_id", postId).eq("user_id", userId)
      } else {
        await supabase.from("reposts").insert({ post_id: postId, user_id: userId })
      }
      fetchPostAndReplies()
    } catch (error) {
      console.error("Error toggling repost:", error)
    }
  }

  const handleReplyCreated = () => {
    fetchPostAndReplies()
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Post not found</h2>
          <p className="text-gray-500 mb-4">This post may have been deleted or doesn't exist.</p>
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto border-x">
        {/* Header */}
        <div className="sticky top-0 bg-white/80 backdrop-blur-md border-b px-4 py-3 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold">Post</h1>
        </div>

        {/* Main Post */}
        <PostCard
          post={post}
          currentUserId={userId}
          currentUser={currentUser}
          onLike={handleLike}
          onRepost={handleRepost}
          onReply={handleReplyCreated}
        />

        {/* Reply Form */}
        {currentUser && (
          <div className="border-b">
            <CreatePost userId={userId} replyTo={postId} onPostCreated={handleReplyCreated} />
          </div>
        )}

        {/* Replies */}
        <div className="divide-y">
          <h3 className="my-2 px-4 border-b">All Reply</h3>
          {replies.map((reply) => (
            <PostCard
              key={reply.id}
              post={reply}
              currentUserId={userId}
              currentUser={currentUser}
              onLike={handleLike}
              onRepost={handleRepost}
              onReply={handleReplyCreated}
            />
          ))}
        </div>

        {replies.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>No replies yet. Be the first to reply!</p>
          </div>
        )}
      </div>
    </div>
  )
}
