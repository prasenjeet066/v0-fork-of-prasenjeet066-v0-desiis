"use client"

import { useState } from "react"
import { formatDistanceToNow } from "date-fns"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Heart, MessageCircle, Repeat2, Share } from "lucide-react"
import Link from "next/link"
import { ReplyDialog } from "./reply-dialog"
import { RepostDialog } from "./repost-dialog"
import { PostActionsMenu } from "./post-actions-menu"
import { VerificationBadge } from "@/components/badge/verification-badge"
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
    is_repost: boolean
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

export function PostCard({ post, currentUserId, currentUser, onLike, onRepost, onReply }: PostCardProps) {
  const [showReplyDialog, setShowReplyDialog] = useState(false)
  const [showRepostDialog, setShowRepostDialog] = useState(false)
  const isRepost = post.is_repost
  const formatContent = (content: string) => {
    return content
      .replace(
        /#([a-zA-Z0-9_\u0980-\u09FF]+)/g,
        '<span class="text-blue-600 hover:underline cursor-pointer">#$1</span>',
      )
      .replace(/@([a-zA-Z0-9_]+)/g, '<span class="text-blue-600 hover:underline cursor-pointer">@$1</span>')
  }

  const displayTime =
    post.is_repost && post.repost_created_at ? new Date(post.repost_created_at) : new Date(post.created_at)

  const handleReplyClick = () => {
    setShowReplyDialog(true)
  }

  const handleRepostClick = () => {
    setShowRepostDialog(true)
  }

  const handleDialogReply = () => {
    setShowReplyDialog(false)
    onReply?.()
  }

  const handleDialogRepost = () => {
    setShowRepostDialog(false)
    onRepost(post.id, post.is_reposted)
  }

  const handlePostClick = () => {
    window.location.href = `/post/${post.id}`
  }

  return (
    <>
      <div className="border-b hover:bg-gray-50 transition-colors cursor-pointer" onClick={handlePostClick}>
        {/* Repost indicator and original post */}
        {post.is_repost && (
          <div className="px-3 lg:px-4 pt-2 lg:pt-3">
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
              <Repeat2 className="h-4 w-4" />
              <Link
                href={`/profile/${post.repost_username}`}
                className="hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                <span className="font-semibold">{post.repost_display_name}</span> reposted
              </Link>
            </div>

            {/* Original post card */}
            <div className="border rounded-lg p-3 bg-gray-50 mb-2">
              <div className="flex gap-2">
                <Link href={`/profile/${post.username}`} className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                  <Avatar className="cursor-pointer h-8 w-8">
                    <AvatarImage src={post.avatar_url || undefined} />
                    <AvatarFallback>{post.display_name?.charAt(0)?.toUpperCase() || "U"}</AvatarFallback>
                  </Avatar>
                </Link>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1 mb-1">
                    <Link
                      href={`/profile/${post.username}`}
                      className="hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span className="font-semibold text-sm flex items-center gap-1">
                        {post.display_name}
                        {post.is_verified && <VerificationBadge verified={true} size={15} className="h-5 w-5" />}
                      </span>
                    </Link>
                    <span className="text-gray-500 text-sm">@{post.username}</span>
                    <span className="text-gray-500 text-sm">·</span>
                    <span className="text-gray-500 text-xs">
                      {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  <div
                    className="text-gray-900 text-sm leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: formatContent(post.content) }}
                  />
                  {/* Media display for original post */}
                  {post.media_urls && post.media_urls.length > 0 && (
                    <div className="mt-2 rounded-lg overflow-hidden border">
                      {post.media_type === "video" ? (
                        <video src={post.media_urls[0]} className="w-full max-h-48 object-cover" controls />
                      ) : (
                        <div className={`grid gap-1 ${post.media_urls.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
                          {post.media_urls.slice(0, 4).map((url, index) => (
                            <img
                              key={index}
                              src={url || "/placeholder.svg"}
                              alt="Post media"
                              className="w-full h-24 object-cover cursor-pointer hover:opacity-90"
                              onClick={(e) => {
                                e.stopPropagation()
                                window.open(url, "_blank")
                              }}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="p-3 lg:p-4">
          <div className="flex gap-2 lg:gap-3">
            <Link href={`/profile/${post.username}`} className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
              <Avatar className="cursor-pointer h-10 w-10 lg:h-12 lg:w-12">
                <AvatarImage src={post.avatar_url || undefined} />
                <AvatarFallback>{post.display_name?.charAt(0)?.toUpperCase() || "U"}</AvatarFallback>
              </Avatar>
            </Link>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1 lg:gap-2 mb-1 flex-wrap">
                <Link
                  href={`/profile/${post.username}`}
                  className="hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span className="font-semibold text-sm lg:text-base truncate flex items-center gap-1">
                    {post.display_name}
                    {post.is_verified && <VerificationBadge verified={true} size={15} className="h-5 w-5" />}
                  </span>
                </Link>
                <Link
                  href={`/profile/${post.username}`}
                  className="hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span className="text-gray-500 text-sm truncate">@{post.username}</span>
                </Link>
                <span className="text-gray-500 text-sm">·</span>
                <span className="text-gray-500 text-xs lg:text-sm">
                  {formatDistanceToNow(displayTime, { addSuffix: true })}
                </span>
                <div className="ml-auto">
                  <PostActionsMenu
                    post={post}
                    currentUserId={currentUserId}
                    onPostUpdated={onReply}
                    onPostDeleted={onReply}
                  />
                </div>
              </div>

              {!post.is_repost && (
                <div
                  className="text-gray-900 mb-3 whitespace-pre-wrap text-sm lg:text-base leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: formatContent(post.content) }}
                />
              )}

              {/* Media display for non-repost */}
              {post.media_urls && post.media_urls.length > 0 && (
                <div className="mb-3 rounded-lg overflow-hidden border">
                  {post.media_type === "video" ? (
                    <video src={post.media_urls[0]} className="w-full max-h-96 object-cover" controls />
                  ) : (
                    <div className={`grid gap-1 ${post.media_urls.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
                      {post.media_urls.slice(0, 4).map((url, index) => (
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
                  )}
                </div>
              )}

              <div className="flex items-center justify-between max-w-sm lg:max-w-md">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-500 hover:text-blue-600 p-1 lg:p-2"
                  onClick={(e) => {
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
                  className={`${post.is_reposted ? "text-green-600" : "text-gray-500"} hover:text-green-600 p-1 lg:p-2`}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleRepostClick()
                  }}
                >
                  <Repeat2 className="h-4 w-4 mr-1" />
                  <span className="text-xs lg:text-sm">{post.reposts_count}</span>
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  className={`${post.is_liked ? "text-red-600" : "text-gray-500"} hover:text-red-600 p-1 lg:p-2`}
                  onClick={(e) => {
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
                  className="text-gray-500 hover:text-blue-600 p-1 lg:p-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Share className="h-4 w-4 mr-1" />
                  <span className="text-xs lg:text-sm">Share</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <ReplyDialog
        isOpen={showReplyDialog}
        onClose={() => setShowReplyDialog(false)}
        post={post}
        currentUser={currentUser}
        onReply={handleDialogReply}
      />

      <RepostDialog
        isOpen={showRepostDialog}
        onClose={() => setShowRepostDialog(false)}
        post={post}
        currentUser={currentUser}
        onRepost={handleDialogRepost}
      />
    </>
  )
  }
