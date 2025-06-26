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
likes_count: number
is_liked: boolean
posts_count: number
is_posted: boolean
reply_to: string | null
media_urls: string[] | null
media_type: string | null
is_post: boolean,
  post_of: string | null
post_user_id: string | null
post_username: string | null
post_display_name: string | null
post_created_at: string | null
is_verified: boolean
  }
  currentUserId: string
  currentUser: any
  onLike: (postId: string, isLiked: boolean) => void
  onpost: (postId: string, isposted: boolean) => void
  onReply?: () => void
}

function extractFirstUrl(text: string) {
  const urlRegex = /(https?:\/\/[^\s]+)/g
  const match = text.match(urlRegex)
  return match ? match[0] : null
}

type postProfile = {
  username: string
  display_name: string
  avatar_url: string | null
  is_verified?: boolean
}

type postData = {
  id: string
  content: string
  created_at: string
  user_id: string
  media_urls: string[] | null
  media_type: string | null
  reply_to: string | null
  profiles: postProfile
}

export function PostCard({ post, currentUserId, currentUser, onLike, onpost, onReply }: PostCardProps) {
  const [showReplyDialog, setShowReplyDialog] = useState(false)
  const [postLoading, setpostLoading] = useState(false)
  const [post, setpost] = useState<postData | null>(null)
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

  // post handler
  const handlepost = async () => {
    setpostLoading(true)
    try {
      const { error } = await supabase
        .from("posts")
        .insert({ 
          post_of: post.id, 
          user_id: currentUser.id
          
        }) // <-- Fixed comma
      if (!error) {
        onpost(post.id, true)
      }
    } catch (error) {
      console.error("Error posting:", error)
    } finally {
      setpostLoading(false)
    }
  }
  // Fetch post data if this is a post
  
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

  // Render post layout
  if (post.post_of!==null && post.is_post) {
    return (
      <>
        <div className="border-b hover:bg-gray-50 transition-colors">
          {/* post Header */}
          <div className="px-4 pt-3 pb-2">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Repeat2 className="h-4 w-4 text-green-600" />
              <Link
                href={`/profile/${post.username}`}
                className="hover:underline font-medium"
                onClick={e => e.stopPropagation()}
              >
                {post.post_display_name}
              </Link>
              <span>posted</span>
              <span className="text-gray-400">·</span>
              <span className="text-gray-500 text-xs">
                {formatDistanceToNow(new Date(post.post_created_at), { addSuffix: true })}
              </span>
            </div>
          </div>
          {/* Original Post */}
          <div className="px-4 pb-4 cursor-pointer" onClick={handlePostClick}>
            <div className="border rounded-xl p-4 bg-white hover:bg-gray-50 transition-colors">
              <div className="flex gap-3">
                <Link href={`/profile/${post.post_username}`} className="flex-shrink-0" onClick={e => e.stopPropagation()}>
                  <Avatar className="cursor-pointer h-10 w-10">
                    <AvatarImage src={post.profiles.avatar_url || undefined} />
                    <AvatarFallback>{post.avatar_url?.charAt(0)?.toUpperCase() || "U"}</AvatarFallback>
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
                        {r.is_verified && <VerificationBadge className="h-4 w-4" size={15}/>}
                      </span>
                    </Link>
                    <div className="flex flex-row items-center gap-1">
                      <span className="text-gray-500 text-[10px]">@{post.username}</span>
                      <span className="text-gray-500 text-[10px]">·</span>
                      <span className="text-gray-500 text-[10px]">
                        {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                  <div
                    className="text-gray-900 mb-3 whitespace-pre-wrap leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: formatContent(post.content) }}
                  />
                  {renderMedia(post.media_urls, post.media_type)}
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
                        await handlepost()
                      }}
                      disabled={postLoading}
                    >
                      {postLoading ? (
                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                      ) : (
                        <Repeat2 className="h-4 w-4 mr-1" />
                      )}
                      <span className="text-xs lg:text-sm">{post.posts_count}</span>
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
                    await handlepost()
                  }}
                  disabled={postLoading}
                >
                  {postLoading ? (
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  ) : (
                    <Repeat2 className="h-4 w-4 mr-1" />
                  )}
                  <span className="text-xs lg:text-sm">{post.posts_count}</span>
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
