"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { supabase } from "@/lib/supabase/client"
import { Loader2 } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface RepostDialogProps {
  isOpen: boolean
  onClose: () => void
  post: any
  currentUser: any
  onRepost: () => void
}

export function RepostDialog({ isOpen, onClose, post, currentUser, onRepost }: RepostDialogProps) {
  const [content, setContent] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [repostType, setRepostType] = useState<"simple" | "quote">("simple")

  const handleSimpleRepost = async () => {
    if (!currentUser) return

    setIsLoading(true)
    try {
      const { error } = await supabase.from("reposts").insert({ post_id: post.id, user_id: currentUser.id })

      if (!error) {
        onRepost()
        onClose()
      }
    } catch (error) {
      console.error("Error reposting:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleQuoteRepost = async () => {
    if (!currentUser || !content.trim()) return

    setIsLoading(true)
    try {
      // Create a new post that quotes the original
      const { error } = await supabase.from("posts").insert({
        user_id: currentUser.id,
        content: content.trim(),
        quoted_post_id: post.id,
      })

      if (!error) {
        onRepost()
        onClose()
        setContent("")
      }
    } catch (error) {
      console.error("Error quote reposting:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Repost</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-2">
            <Button
              variant={repostType === "simple" ? "default" : "outline"}
              onClick={() => setRepostType("simple")}
              className="flex-1"
            >
              Simple Repost
            </Button>
            <Button
              variant={repostType === "quote" ? "default" : "outline"}
              onClick={() => setRepostType("quote")}
              className="flex-1"
            >
              Quote Repost
            </Button>
          </div>

          {repostType === "quote" && (
            <div className="flex gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={currentUser?.avatar_url || "/placeholder.svg"} />
                <AvatarFallback>{currentUser?.display_name?.charAt(0)?.toUpperCase() || "U"}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <Textarea
                  placeholder="Add a comment..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="min-h-[80px]"
                />
              </div>
            </div>
          )}

          {/* Original Post Preview */}
          <div className="border rounded-lg p-3 bg-gray-50">
            <div className="flex gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={post.avatar_url || "/placeholder.svg"} />
                <AvatarFallback>{post.display_name?.charAt(0)?.toUpperCase() || "U"}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-semibold">{post.display_name}</span>
                  <span className="text-gray-500">@{post.username}</span>
                  <span className="text-gray-500">·</span>
                  <span className="text-gray-500">
                    {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                  </span>
                </div>
                <p className="text-sm mt-1">{post.content}</p>

                {/* Show media if exists */}
                {post.media_urls && post.media_urls.length > 0 && (
                  <div className="mt-2 rounded overflow-hidden">
                    {post.media_type === "video" ? (
                      <video src={post.media_urls[0]} className="w-full max-h-40 object-cover" controls />
                    ) : (
                      <img
                        src={post.media_urls[0] || "/placeholder.svg"}
                        alt="Post media"
                        className="w-full max-h-40 object-cover"
                      />
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={repostType === "simple" ? handleSimpleRepost : handleQuoteRepost}
              disabled={isLoading || (repostType === "quote" && !content.trim())}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {repostType === "simple" ? "Repost" : "Quote Repost"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
