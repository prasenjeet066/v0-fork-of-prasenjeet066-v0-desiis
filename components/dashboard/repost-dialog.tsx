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
  await handleSimpleRepost();
 /**
  const handleQuoteRepost = async () => {
    if (!currentUser || !content.trim()) return

    setIsLoading(true)
    try {
      // Create a new post that quotes the original
      const { error } = await supabase.from("posts").insert({
        user_id: currentUser.id,
        content: post.content,
        user_id: userId,
          
  
          media_urls: post.media_urls,
          media_type: post.media_type,
        repost_of: post.id,
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
  }**/

  return (
    <></>
  )
}
