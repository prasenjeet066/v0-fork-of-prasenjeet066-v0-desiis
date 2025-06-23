"use client"

import { useEffect, useState } from "react"
import type { Post } from "@/types"
import { useSession } from "next-auth/react"
import { supabase } from "@/lib/supabase"
import { EnhancedPostCard } from "./enhanced-post-card"
import { BlockReportDialog } from "@/components/moderation/block-report-dialog"

interface TimelineProps {
  userId?: string
}

const Timeline = ({ userId }: TimelineProps) => {
  const { data: session } = useSession()
  const [posts, setPosts] = useState<Post[]>([])
  const [profile, setProfile] = useState<any>(null)

  const [blockReportDialog, setBlockReportDialog] = useState<{
    isOpen: boolean
    type: "block" | "report"
    userId?: string
    postId?: string
    username?: string
  }>({
    isOpen: false,
    type: "block",
  })

  useEffect(() => {
    fetchPosts()
    fetchProfile()
  }, [session, userId])

  const fetchPosts = async () => {
    if (userId) {
      const { data, error } = await supabase
        .from("posts")
        .select(`*, author:profiles(*)`)
        .eq("author_id", userId)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error fetching posts:", error)
      } else {
        setPosts(data as Post[])
      }
    } else {
      const { data, error } = await supabase
        .from("posts")
        .select(`*, author:profiles(*)`)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error fetching posts:", error)
      } else {
        setPosts(data as Post[])
      }
    }
  }

  const fetchProfile = async () => {
    if (session?.user?.email) {
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("email", session?.user?.email)
        .single()

      if (profileError) {
        console.error("Error fetching profile:", profileError)
      } else {
        setProfile(profileData)
      }
    }
  }

  const handleLike = async (postId: string) => {
    const { data: existingLike, error: existingLikeError } = await supabase
      .from("likes")
      .select("*")
      .eq("post_id", postId)
      .eq("user_id", profile?.id)
      .single()

    if (existingLikeError && existingLikeError.code !== "PGRST116") {
      console.error("Error checking existing like:", existingLikeError)
      return
    }

    if (existingLike) {
      // Unlike the post
      const { error: deleteError } = await supabase
        .from("likes")
        .delete()
        .eq("post_id", postId)
        .eq("user_id", profile?.id)

      if (deleteError) {
        console.error("Error unliking post:", deleteError)
      } else {
        fetchPosts() // Refresh posts
      }
    } else {
      // Like the post
      const { error: insertError } = await supabase.from("likes").insert([
        {
          post_id: postId,
          user_id: profile?.id,
        },
      ])

      if (insertError) {
        console.error("Error liking post:", insertError)
      } else {
        fetchPosts() // Refresh posts
      }
    }
  }

  const handleRepost = async (postId: string) => {
    const originalPost = posts.find((post) => post.id === postId)

    if (!originalPost) {
      console.error("Original post not found")
      return
    }

    const { error } = await supabase.from("posts").insert([
      {
        content: originalPost.content,
        author_id: profile?.id,
        original_post_id: postId,
      },
    ])

    if (error) {
      console.error("Error reposting:", error)
    } else {
      fetchPosts() // Refresh posts
    }
  }

  const handleDeletePost = async (postId: string) => {
    if (confirm("Are you sure you want to delete this post?")) {
      await supabase.from("posts").delete().eq("id", postId)
      fetchPosts() // Refresh posts
    }
  }

  const handleBlockUser = (userId: string, username: string) => {
    setBlockReportDialog({
      isOpen: true,
      type: "block",
      userId,
      username,
    })
  }

  const handleReportPost = (postId: string) => {
    setBlockReportDialog({
      isOpen: true,
      type: "report",
      postId,
    })
  }

  return (
    <div>
      {posts.map((post) => (
        <EnhancedPostCard
          key={post.id}
          post={post}
          currentUserId={userId}
          currentUser={profile}
          onLike={handleLike}
          onRepost={handleRepost}
          onDelete={handleDeletePost}
          onBlock={handleBlockUser}
          onReport={handleReportPost}
          onReply={fetchPosts}
        />
      ))}
      <BlockReportDialog
        isOpen={blockReportDialog.isOpen}
        onClose={() => setBlockReportDialog({ ...blockReportDialog, isOpen: false })}
        type={blockReportDialog.type}
        userId={blockReportDialog.userId}
        postId={blockReportDialog.postId}
        username={blockReportDialog.username}
        onSuccess={() => {
          if (blockReportDialog.type === "block") {
            fetchPosts() // Refresh to hide blocked user's posts
          }
        }}
      />
    </div>
  )
}

export { Timeline as default, Timeline }
