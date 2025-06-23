"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { supabase } from "@/lib/supabase/client"
import { Loader2, Repeat2, CheckCircle } from "lucide-react"

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

  const handleRepost = async (withComment = false) => {
    if (!currentUser) return

    setIsLoading(true)
    try {
      if (withComment && content.trim()) {
        // Create a quote repost with comment
        const { error } = await supabase.from("posts").insert({
          user_id: currentUser.id,
          content: content.trim(),
          repost_of: post.id,
        })
        if (error) throw error
      } else {
        // Simple repost - check if already reposted
        const { data: existingRepost } = await supabase
          .from("reposts")
          .select("id")
          .eq("user_id", currentUser.id)
          .eq("post_id", post.id)
          .single()

        if (existingRepost) {
          // Remove repost
          const { error } = await supabase.from("reposts").delete().eq("user_id", currentUser.id).eq("post_id", post.id)
          if (error) throw error
        } else {
          // Add repost
          const { error } = await supabase.from("reposts").insert({
            user_id: currentUser.id,
            post_id: post.id,
          })
          if (error) throw error
        }
      }

      onRepost()
      onClose()
      setContent("")
    } catch (error) {
      console.error("Error reposting:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Repeat2 className="h-5 w-5" />
            Repost
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Quote repost option */}
          <div>
            <Textarea
              placeholder="Add your comment (optional)"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="resize-none"
              rows={3}
            />
          </div>

          {/* Original post preview */}
          <div className="border rounded-lg p-3 bg-gray-50">
            <div className="flex gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={post.avatar_url || "/placeholder.svg"} />
                <AvatarFallback>{post.display_name?.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-1 text-sm">
                  <span className="font-semibold flex items-center gap-1">
                    {post.display_name}
                    {post.is_verified && <CheckCircle className="h-3 w-3 text-black fill-current" />}
                  </span>
                  <span className="text-gray-500">@{post.username}</span>
                </div>
                <p className="text-sm mt-1">{post.content}</p>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            <Button onClick={() => handleRepost(false)} disabled={isLoading} variant="outline" className="flex-1">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {post.is_reposted ? "Unrepost" : "Repost"}
            </Button>
            <Button onClick={() => handleRepost(true)} disabled={isLoading || !content.trim()} className="flex-1">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Quote Repost
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
