"use client"

import { useState } from "react"
import { formatDistanceToNow } from "date-fns"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Heart,
  MessageCircle,
  Repeat2,
  Share,
  CheckCircle,
  MoreHorizontal,
  Trash2,
  Edit,
  Flag,
  UserX,
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import Link from "next/link"
import { ReplyDialog } from "./reply-dialog"
import { RepostDialog } from "./repost-dialog"
import { VideoPlayer } from "@/components/media/video-player"
import { ImageViewer } from "@/components/media/image-viewer"

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
    // Original post data for reposts
    original_post?: {
      id: string
      content: string
      created_at: string
      user_id: string
      username: string
      display_name: string
      avatar_url: string | null
      is_verified?: boolean
      media_urls: string[] | null
      media_type: string | null
    }
  }
  currentUserId: string
  currentUser: any
  onLike: (postId: string, isLiked: boolean) => void
  onRepost: (postId: string, isReposted: boolean) => void
  onDelete?: (postId: string) => void
  onBlock?: (userId: string) => void
  onReport?: (postId: string) => void
  onReply?: () => void
}

export function EnhancedPostCard({
  post,
  currentUserId,
  currentUser,
  onLike,
  onRepost,
  onDelete,
  onBlock,
  onReport,
  onReply,
}: PostCardProps) {
  const [showReplyDialog, setShowReplyDialog] = useState(false)
  const [showRepostDialog, setShowRepostDialog] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

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

  const isOwnPost = post.user_id === currentUserId

  const renderMediaContent = (mediaUrls: string[] | null, mediaType: string | null) => {
    if (!mediaUrls || mediaUrls.length === 0) return null

    return (
      <div className="mb-3 rounded-lg overflow-hidden border">
        {mediaType === "video" ? (
          <VideoPlayer src={mediaUrls[0]} className="w-full max-h-96" />
        ) : (
          <div className={`grid gap-1 ${mediaUrls.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
            {mediaUrls.slice(0, 4).map((url, index) => (
              <img
                key={index}
                src={url || "/placeholder.svg"}
                alt="Post media"
                className="w-full h-32 lg:h-48 object-cover cursor-pointer hover:opacity-90"
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedImage(url)
                }}
              />
            ))}
          </div>
        )}
      </div>
    )
  }

  const renderOriginalPost = (originalPost: any) => (
    <div className="border rounded-lg p-3 mt-3 bg-gray-50">
      <div className="flex gap-2">
        <Link href={`/profile/${originalPost.username}`} onClick={(e) => e.stopPropagation()}>
          <Avatar className="h-8 w-8">
            <AvatarImage src={originalPost.avatar_url || undefined} />
            <AvatarFallback>{originalPost.display_name?.charAt(0)?.toUpperCase() || "U"}</AvatarFallback>
          </Avatar>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 mb-1">
            <Link
              href={`/profile/${originalPost.username}`}
              className="hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              <span className="font-semibold text-sm flex items-center gap-1">
                {originalPost.display_name}
                {originalPost.is_verified && <CheckCircle className="h-3 w-3 text-black" />}
              </span>
            </Link>
            <span className="text-gray-500 text-xs">@{originalPost.username}</span>
            <span className="text-gray-500 text-xs">·</span>
            <span className="text-gray-500 text-xs">
              {formatDistanceToNow(new Date(originalPost.created_at), { addSuffix: true })}
            </span>
          </div>
          <div
            className="text-gray-900 text-sm whitespace-pre-wrap"
            dangerouslySetInnerHTML={{ __html: formatContent(originalPost.content) }}
          />
          {renderMediaContent(originalPost.media_urls, originalPost.media_type)}
        </div>
      </div>
    </div>
  )

  return (
    <>
      <div className="border-b hover:bg-gray-50 transition-colors cursor-pointer" onClick={handlePostClick}>
        {/* Repost indicator */}
        {post.is_repost && (
          <div className="px-3 lg:px-4 pt-2 lg:pt-3 pb-1">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Repeat2 className="h-4 w-4" />
              <Link
                href={`/profile/${post.repost_username}`}
                className="hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                <span className="font-semibold">{post.repost_display_name}</span> reposted
              </Link>
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
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1 lg:gap-2 flex-wrap">
                  <Link
                    href={`/profile/${post.username}`}
                    className="hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span className="font-semibold text-sm lg:text-base truncate flex items-center gap-1">
                      {post.display_name}
                      {post.is_verified && <CheckCircle className="h-4 w-4 text-black" />}
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
                </div>

                {/* More options dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {isOwnPost ? (
                      <>
                        <DropdownMenuItem onClick={() => onDelete?.(post.id)}>
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Post
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Post
                        </DropdownMenuItem>
                      </>
                    ) : (
                      <>
                        <DropdownMenuItem onClick={() => onReport?.(post.id)}>
                          <Flag className="h-4 w-4 mr-2" />
                          Report Post
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onBlock?.(post.user_id)}>
                          <UserX className="h-4 w-4 mr-2" />
                          Block User
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div
                className="text-gray-900 mb-3 whitespace-pre-wrap text-sm lg:text-base leading-relaxed"
                dangerouslySetInnerHTML={{ __html: formatContent(post.content) }}
              />

              {/* Show original post for reposts */}
              {post.is_repost && post.original_post && renderOriginalPost(post.original_post)}

              {/* Media display for regular posts */}
              {!post.is_repost && renderMediaContent(post.media_urls, post.media_type)}

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

      {/* Image Viewer */}
      {selectedImage && (
        <ImageViewer
          src={selectedImage || "/placeholder.svg"}
          alt="Post media"
          isOpen={!!selectedImage}
          onClose={() => setSelectedImage(null)}
        />
      )}

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
