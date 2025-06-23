"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { supabase } from "@/lib/supabase/client"
import { createPostSchema } from "@/lib/validations/post"
import { Loader2, ImageIcon, Smile, Hash, AtSign, X } from "lucide-react"
import { VideoPlayer } from "@/components/media/video-player"
import { ImageViewer } from "@/components/media/image-viewer"

interface CreatePostProps {
  userId: string
  replyTo?: string
  onPostCreated?: () => void
}

export function CreatePost({ userId, replyTo, onPostCreated }: CreatePostProps) {
  const [content, setContent] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [mediaFiles, setMediaFiles] = useState<File[]>([])
  const [mediaUrls, setMediaUrls] = useState<string[]>([])
  const [isUploadingMedia, setIsUploadingMedia] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  const handleMediaUpload = async (files: FileList) => {
    if (files.length === 0) return

    const validFiles = Array.from(files).filter((file) => {
      const isValidType = file.type.startsWith("image/") || file.type.startsWith("video/")
      const isValidSize = file.size <= 10 * 1024 * 1024 // 10MB
      return isValidType && isValidSize
    })

    if (validFiles.length === 0) {
      setError("Please select valid image or video files (max 10MB each)")
      return
    }

    setIsUploadingMedia(true)
    const uploadedUrls: string[] = []

    try {
      for (const file of validFiles) {
        const fileExt = file.name.split(".").pop()
        const fileName = `${Date.now()}-${Math.random()}.${fileExt}`
        const filePath = `posts/${userId}/${fileName}`

        const { error: uploadError } = await supabase.storage.from("post-media").upload(filePath, file)

        if (uploadError) throw uploadError

        const {
          data: { publicUrl },
        } = supabase.storage.from("post-media").getPublicUrl(filePath)

        uploadedUrls.push(publicUrl)
      }

      setMediaFiles((prev) => [...prev, ...validFiles])
      setMediaUrls((prev) => [...prev, ...uploadedUrls])
    } catch (error) {
      console.error("Error uploading media:", error)
      setError("Failed to upload media")
    } finally {
      setIsUploadingMedia(false)
    }
  }

  const removeMedia = (index: number) => {
    setMediaFiles((prev) => prev.filter((_, i) => i !== index))
    setMediaUrls((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const validatedData = createPostSchema.parse({ content, replyTo })

      // Extract hashtags from content
      const hashtags = content.match(/#[a-zA-Z0-9_\u0980-\u09FF]+/g) || []

      const { data: postData, error: postError } = await supabase
        .from("posts")
        .insert({
          user_id: userId,
          content: validatedData.content,
          reply_to: validatedData.replyTo || null,
          media_urls: mediaUrls.length > 0 ? mediaUrls : null,
          media_type: mediaUrls.length > 0 ? (mediaFiles[0]?.type.startsWith("video/") ? "video" : "image") : null,
        })
        .select()
        .single()

      if (postError) {
        setError(postError.message)
      } else {
        // Process hashtags
        for (const hashtag of hashtags) {
          const tagName = hashtag.slice(1) // Remove # symbol

          // Insert or get hashtag
          const { data: hashtagData, error: hashtagError } = await supabase
            .from("hashtags")
            .upsert({ name: tagName })
            .select()
            .single()

          if (!hashtagError && hashtagData) {
            // Link post to hashtag
            await supabase.from("post_hashtags").insert({ post_id: postData.id, hashtag_id: hashtagData.id })
          }
        }

        setContent("")
        setMediaFiles([])
        setMediaUrls([])
        onPostCreated?.()
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message)
      }
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

      // Set cursor position after inserted text
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
    <div className="border-b p-3 lg:p-4 bengali-font bg-white">
      <form onSubmit={handleSubmit}>
        <div className="flex gap-2 lg:gap-3">
          <Avatar className="cursor-pointer h-10 w-10 lg:h-12 lg:w-12">
                <AvatarImage src={post.avatar_url || undefined} />
                <AvatarFallback>{post.display_name?.charAt(0)?.toUpperCase() || "U"}</AvatarFallback>
              </Avatar>
          <div className="flex-1 min-w-0">
            <Textarea
              ref={textareaRef}
              placeholder="কী ঘটছে?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="border-none resize-none text-lg lg:text-xl placeholder:text-lg lg:placeholder:text-xl focus-visible:ring-0 p-0"
              rows={3}
              disabled={isLoading}
            />

            {/* Media preview */}
            {mediaUrls.length > 0 && (
              <div className="mt-3 grid grid-cols-2 gap-2 rounded-lg overflow-hidden">
                {mediaUrls.map((url, index) => (
                  <div key={index} className="relative">
                    {mediaFiles[index]?.type.startsWith("video/") ? (
                      <VideoPlayer src={url} className="w-full h-32 rounded" />
                    ) : (
                      <img
                        src={url || "/placeholder.svg"}
                        alt={`Upload ${index + 1}`}
                        className="w-full h-32 object-cover rounded cursor-pointer hover:opacity-90"
                        onClick={() => setSelectedImage(url)}
                      />
                    )}
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-1 right-1 h-6 w-6"
                      onClick={() => removeMedia(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Image Viewer */}
            {selectedImage && (
              <ImageViewer
                src={selectedImage || "/placeholder.svg"}
                alt="Preview"
                isOpen={!!selectedImage}
                onClose={() => setSelectedImage(null)}
              />
            )}

            {error && <p className="text-sm text-red-600 mt-2">{error}</p>}

            <div className="flex items-center justify-between mt-3 lg:mt-4">
              <div className="flex items-center gap-1 lg:gap-2">
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
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-blue-600 hover:bg-blue-50 p-2"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingMedia || mediaUrls.length >= 4}
                >
                  {isUploadingMedia ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
                </Button>
                <Button type="button" variant="ghost" size="sm" className="text-gray-500 p-2" disabled>
                  <Smile className="h-4 w-4" />
                </Button>
                <span className={`text-sm ml-2 ${remainingChars < 20 ? "text-red-500" : "text-gray-500"}`}>
                  {remainingChars}
                </span>
              </div>

              <Button
                type="submit"
                disabled={!content.trim() || remainingChars < 0 || isLoading}
                className="rounded-full px-4 lg:px-6 text-sm lg:text-base"
                size="sm"
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                পোস্ট করুন
              </Button>
            </div>
          </div>
        </div>
      </form>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        multiple
        className="hidden"
        onChange={(e) => e.target.files && handleMediaUpload(e.target.files)}
      />
    </div>
  )
}
