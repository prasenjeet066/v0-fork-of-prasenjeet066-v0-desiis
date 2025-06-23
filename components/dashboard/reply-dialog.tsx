"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { supabase } from "@/lib/supabase/client"
import { Loader2, MessageCircle, ImageIcon, Hash, AtSign } from "lucide-react"

interface ReplyDialogProps {
  isOpen: boolean
  onClose: () => void
  post: any
  currentUser: any
  onReply: () => void
}

export function ReplyDialog({ isOpen, onClose, post, currentUser, onReply }: ReplyDialogProps) {
  const [content, setContent] = useState(`@${post.username} `)
  const [isLoading, setIsLoading] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  if (!currentUser) {
    // Profile is still loading; don’t render the dialog yet.
    return null
  }

  const handleReply = async () => {
    if (!currentUser || !content.trim()) return

    setIsLoading(true)
    try {
      await supabase.from("posts").insert({
        user_id: currentUser.id,
        content: content.trim(),
        reply_to: post.id,
      })

      onReply()
      onClose()
      setContent(`@${post.username} `)
    } catch (error) {
      console.error("Error replying:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const insertText = (text: string) => {
    if (textareaRef.current) {
      const start = textareaRef.current.selectionStart
      const end = textareaRef.current.selectionEnd
      const newContent = content.substring(0, start) + text + content.substring(end)
      setContent(newContent)

      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + text.length
          textareaRef.current.focus()
        }
      }, 0)
    }
  }

  const remainingChars = 280 - content.length

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg bengali-font">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            উত্তর দিন
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Original post */}
          <div className="border-l-2 border-gray-200 pl-3">
            <div className="flex gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={post.avatar_url || "/placeholder.svg"} />
                <AvatarFallback>{post.display_name?.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-1 text-sm">
                  <span className="font-semibold">{post.display_name}</span>
                  <span className="text-gray-500">@{post.username}</span>
                </div>
                <p className="text-sm mt-1 text-gray-700">{post.content}</p>
              </div>
            </div>
          </div>

          {/* Reply form */}
          <div className="flex gap-2">
            <Avatar className="h-10 w-10">
              <AvatarImage src={currentUser?.avatar_url || "/placeholder.svg"} />
              <AvatarFallback>{currentUser?.display_name?.charAt(0) || "ব"}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <Textarea
                ref={textareaRef}
                placeholder="আপনার উত্তর লিখুন..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="border-none resize-none focus-visible:ring-0 p-0"
                rows={4}
                disabled={isLoading}
              />

              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => insertText("#")}
                    className="text-blue-600 hover:bg-blue-50 p-2"
                  >
                    <Hash className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => insertText("@")}
                    className="text-blue-600 hover:bg-blue-50 p-2"
                  >
                    <AtSign className="h-4 w-4" />
                  </Button>
                  <Button type="button" variant="ghost" size="sm" className="text-gray-500 p-2" disabled>
                    <ImageIcon className="h-4 w-4" />
                  </Button>
                  <span className={`text-sm ml-2 ${remainingChars < 20 ? "text-red-500" : "text-gray-500"}`}>
                    {remainingChars}
                  </span>
                </div>

                <Button
                  onClick={handleReply}
                  disabled={!content.trim() || remainingChars < 0 || isLoading}
                  className="rounded-full px-6"
                  size="sm"
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  উত্তর দিন
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
