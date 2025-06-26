"use client"

import { useState, useEffect } from "react"
import { formatDistanceToNow } from "date-fns"
//import DOMPurify from 'dompurify'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Heart, MoreHorizontal, Loader2, MessageCircle, Repeat2, Share } from "lucide-react"
import Link from "next/link"
import { ReplyDialog } from "./reply-dialog"
import { PostActionsMenu } from "./post-actions-menu"
import { VerificationBadge } from "@/components/badge/verification-badge"
import LinkPreview from '@/components/link-preview'

interface PostCardProps {
  post: {
    id: string
    content: string
    created_at: string
    user_id: string
    username: string
    display_name: string
    avatar_url: string | null
    is_verified?: boolean
    likes_count: number
    is_liked: boolean
    reposts_count: number
    is_reposted: boolean
    replies_count?: number
    reply_to: string | null
    media_urls: string[] | null
    media_type: string | null
    is_repost: boolean,
    repost_of : string | null
    repost_user_id: string | null
    repost_username: string | null
    repost_display_name: string | null
    repost_created_at: string | null
  }
  currentUserId: string
  currentUser: any
  onLike: (postId: string, isLiked: boolean) => void
  onRepost: (postId: string, isReposted: boolean) => void
  onReply?: () => void
}

function extractFirstUrl(text: string) {
  const urlRegex = /(https?:\/\/[^\s]+)/g
  const match = text.match(urlRegex)
  return match ? match[0] : null
}

type RepostProfile = {
  username: string
  display_name: string
  avatar_url: string | null
  is_verified?: boolean
}

type RepostData = {
  id: string
  content: string
  created_at: string
  user_id: string
  media_urls: string[] | null
  media_type: string | null
  reply_to: string | null
  profiles: RepostProfile
}

export function PostCard({ post, currentUserId, currentUser, onLike, onRepost, onReply }: PostCardProps) {
  const [showReplyDialog, setShowReplyDialog] = useState(false)
  const [repostLoading, setRepostLoading] = useState(false)
  const [repost, setRepost] = useState<RepostData | null>(null)
  const postUrl = extractFirstUrl(post.content)
  const hasMedia = post.media_urls && post.media_urls.length > 0

  // Format hashtags and mentions
  const formatContent = (content: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    
    return content
      .replace(
      urlRegex,
      '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-blue-600 underline break-all">$1</a>'
    )
      .replace(
        /#([a-zA-Z0-9_\u0980-\u09FF]+)/g,
        '<span class="text-blue-600 hover:underline cursor-pointer">#$1</span>',
      )
      .replace(/@([a-zA-Z0-9_]+)/g, '<span class="text-blue-600 hover:underline cursor-pointer">@$1</span>')
      
  }

  // Reply handler
  const handleReplyClick = () => setShowReplyDialog(true)

  // Repost handler
  const handleRepost = async () => {
    setRepostLoading(true)
    try {
      const { error } = await supabase
        .from("posts")
        .insert({ repost_of: post.id, user_id: currentUser.id }) // <-- Fixed comma
      if (!error) {
        onRepost(post.id, true)
      }
    } catch (error) {
      console.error("Error reposting:", error)
    } finally {
      setRepostLoading(false)
    }
  }
  // Fetch repost data if this is a repost
  useEffect(() => {
    const fetchRepost = async () => {
      if (post.is_repost && post.repost_user_id) {
        const { data, error } = await supabase
          .from('posts')
          .select(`
            id,
            content,
            created_at,
            user_id,
            media_urls,
            media_type,
            reply_to,
            profiles!inner(username, display_name, avatar_url, is_verified)
          `)
          .eq('id', post.repost_of)
          .single()
        if (!error && data) {
          setRepost(data)
        }
      }
    }
    fetchRepost()
  }, [post])

  // Render image/video/gif media
  const renderMedia = (mediaUrls: string[] | null, mediaType: string | null) => {
    if (!mediaUrls || mediaUrls.length === 0) return null

    if (mediaType === "video") {
      return (
        <div className="mt-3 rounded-lg overflow-hidden border">
          <video src={mediaUrls[0]} className="w-full max-h-96 object-cover" controls />
        </div>
      )
    }
    if (mediaType === "gif") {
      return (
        <div className={`grid gap-1 ${mediaUrls.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
          {mediaUrls.slice(0, 4).map((url, index) => (
            <div key={index} className="relative">
              <img
                src={url || "/placeholder.svg"}
                alt="GIF media"
                className="w-full h-32 lg:h-48 object-cover cursor-pointer hover:opacity-90"
                onClick={(e) => {
                  e.stopPropagation()
                  window.open(url, "_blank")
                }}
              />
              {url.includes("giphy.com") && (
                <div className="absolute bottom-1 left-1 bg-black/70 text-white text-xs px-1 rounded">GIF</div>
              )}
            </div>
          ))}
        </div>
      )
    }
    // Default: images
    return (
      <div className={`grid gap-1 ${mediaUrls.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
        {mediaUrls.slice(0, 4).map((url, index) => (
          <img
            key={index}
            src={url || "/placeholder.svg"}
            alt="Post media"
            className="w-full h-32 lg:h-48 object-cover cursor-pointer hover:opacity-90"
            onClick={(e) => {
              e.stopPropagation()
              window.open(url, "_blank")
            }}
          />
        ))}
      </div>
    )
  }

  // Click to go to post
  const handlePostClick = () => {
    window.location.href = `/post/${post.id}`
  }

  // Render repost layout
  if (post.is_repost && repost && repost.profiles) {
    return (
      <>
        <div className="border-b hover:bg-gray-50 transition-colors">
          {/* Repost Header */}
          <div className="px-4 pt-3 pb-2">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Repeat2 className="h-4 w-4 text-green-600" />
              <Link
                href={`/profile/${repost.profiles.username}`}
                className="hover:underline font-medium"
                onClick={e => e.stopPropagation()}
              >
                {repost.profiles.display_name}
              </Link>
              <span>reposted</span>
              <span className="text-gray-400">·</span>
              <span className="text-gray-500 text-xs">
                {formatDistanceToNow(new Date(repost.created_at), { addSuffix: true })}
              </span>
            </div>
          </div>
          {/* Original Post */}
          <div className="px-4 pb-4 cursor-pointer" onClick={handlePostClick}>
            <div className="border rounded-xl p-4 bg-white hover:bg-gray-50 transition-colors">
              <div className="flex gap-3">
                <Link href={`/profile/${repost.profiles.username}`} className="flex-shrink-0" onClick={e => e.stopPropagation()}>
                  <Avatar className="cursor-pointer h-10 w-10">
                    <AvatarImage src={repost.profiles.avatar_url || undefined} />
                    <AvatarFallback>{repost.profiles.display_name?.charAt(0)?.toUpperCase() || "U"}</AvatarFallback>
                  </Avatar>
                </Link>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col items-left gap-1">
                    <Link
                      href={`/profile/${repost.profiles.username}`}
                      className="hover:underline"
                      onClick={e => e.stopPropagation()}
                    >
                      <span className="font-semibold flex items-center gap-1">
                        {repost.profiles.display_name}
                        {repost.profiles.is_verified && <VerificationBadge className="h-4 w-4" size={15}/>}
                      </span>
                    </Link>
                    <div className="flex flex-row items-center gap-1">
                      <span className="text-gray-500 text-[10px]">@{repost.profiles.username}</span>
                      <span className="text-gray-500 text-[10px]">·</span>
                      <span className="text-gray-500 text-[10px]">
                        {formatDistanceToNow(new Date(repost.created_at), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                  <div
                    className="text-gray-900 mb-3 whitespace-pre-wrap leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: formatContent(repost.content) }}
                  />
                  {renderMedia(repost.media_urls, repost.media_type)}
                  <div className="flex items-center justify-between max-w-md mt-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-gray-500 hover:text-blue-600 hover:bg-blue-50 p-2 rounded-full"
                      onClick={e => {
                        e.stopPropagation()
                        handleReplyClick()
                      }}
                    >
                      <MessageCircle className="h-4 w-4 mr-1" />
                      <span className="text-sm">{post.replies_count || 0}</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={async e => {
                        e.stopPropagation()
                        await handleRepost()
                      }}
                      disabled={repostLoading}
                    >
                      {repostLoading ? (
                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                      ) : (
                        <Repeat2 className="h-4 w-4 mr-1" />
                      )}
                      <span className="text-xs lg:text-sm">{post.reposts_count}</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`${post.is_liked ? "text-red-600 bg-red-50" : "text-gray-500 hover:text-red-600 hover:bg-red-50"} p-2 rounded-full`}
                      onClick={e => {
                        e.stopPropagation()
                        onLike(post.id, post.is_liked)
                      }}
                    >
                      <Heart className={`h-4 w-4 mr-1 ${post.is_liked ? "fill-current" : ""}`} />
                      <span className="text-sm">{post.likes_count}</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-gray-500 hover:text-blue-600 hover:bg-blue-50 p-2 rounded-full"
                      onClick={e => e.stopPropagation()}
                    >
                      <Share className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-gray-500 hover:text-blue-600 hover:bg-blue-50 p-2 rounded-full"
                      onClick={e => e.stopPropagation()}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Reply Dialog */}
        <ReplyDialog
          isOpen={showReplyDialog}
          onClose={() => setShowReplyDialog(false)}
          post={post}
          currentUser={currentUser}
          onReply={() => {
            setShowReplyDialog(false)
            onReply?.()
          }}
        />
      </>
    )
  }

  // Regular post layout
  return (
    <>
      <div className="border-b hover:bg-gray-50 transition-colors cursor-pointer" onClick={handlePostClick}>
        <div className="p-4">
          <div className="flex gap-3">
            <Link href={`/profile/${post.username}`} className="flex-shrink-0" onClick={e => e.stopPropagation()}>
              <Avatar className="cursor-pointer h-10 w-10 lg:h-12 lg:w-12">
                <AvatarImage src={post.avatar_url || undefined} />
                <AvatarFallback>{post.display_name?.charAt(0)?.toUpperCase() || "U"}</AvatarFallback>
              </Avatar>
            </Link>
            <div className="flex-1 min-w-0">
              <div className="flex flex-col items-left gap-1">
                <Link
                  href={`/profile/${post.username}`}
                  className="hover:underline"
                  onClick={e => e.stopPropagation()}
                >
                  <span className="font-semibold flex items-center gap-1">
                    {post.display_name}
                    {post.is_verified && <VerificationBadge className="h-4 w-4" size={15}/>}
                  </span>
                </Link>
                <div className="flex flex-row items-center gap-1 -mt-2">
                  <span className="text-gray-500 text-[10px]">@{post.username}</span>
                  <span className="text-gray-500 text-[10px]">·</span>
                  <span className="text-gray-500 text-[10px]">
                    {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                  </span>
                </div>
              </div>
              <div
                className="text-gray-900 mt-2 mb-3 whitespace-pre-wrap text-sm lg:text-base leading-relaxed"
                dangerouslySetInnerHTML={{ __html: formatContent(post.content) }}
              />
              {!hasMedia && postUrl && (
                <LinkPreview url={postUrl} />
              )}
              {renderMedia(post.media_urls, post.media_type)}
              <div className="flex items-center justify-between max-w-sm lg:max-w-md mt-3">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-500 hover:text-blue-600 hover:bg-blue-50 p-2 rounded-full"
                  onClick={e => {
                    e.stopPropagation()
                    handleReplyClick()
                  }}
                >
                  <MessageCircle className="h-4 w-4 mr-1" />
                  <span className="text-xs lg:text-sm">{post.replies_count || 0}</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={async e => {
                    e.stopPropagation()
                    await handleRepost()
                  }}
                  disabled={repostLoading}
                >
                  {repostLoading ? (
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  ) : (
                    <Repeat2 className="h-4 w-4 mr-1" />
                  )}
                  <span className="text-xs lg:text-sm">{post.reposts_count}</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`${post.is_liked ? "text-red-600 bg-red-50" : "text-gray-500 hover:text-red-600 hover:bg-red-50"} p-2 rounded-full`}
                  onClick={e => {
                    e.stopPropagation()
                    onLike(post.id, post.is_liked)
                  }}
                >
                  <Heart className={`h-4 w-4 mr-1 ${post.is_liked ? "fill-current" : ""}`} />
                  <span className="text-xs lg:text-sm">{post.likes_count}</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-500 hover:text-blue-600 hover:bg-blue-50 p-2 rounded-full"
                  onClick={e => e.stopPropagation()}
                >
                  <Share className="h-4 w-4 mr-1" />
                  <span className="text-xs lg:text-sm">Share</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-500 hover:text-blue-600 hover:bg-blue-50 p-2 rounded-full"
                  onClick={e => e.stopPropagation()}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Reply Dialog */}
      <ReplyDialog
        isOpen={showReplyDialog}
        onClose={() => setShowReplyDialog(false)}
        post={post}
        currentUser={currentUser}
        onReply={() => {
          setShowReplyDialog(false)
          onReply?.()
        }}
      />
    </>
  )
    }
