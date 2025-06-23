"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { supabase } from "@/lib/supabase/client"
import { Loader2 } from "lucide-react"

interface BlockReportDialogProps {
  isOpen: boolean
  onClose: () => void
  type: "block" | "report"
  userId?: string
  postId?: string
  username?: string
  onSuccess?: () => void
}

const reportReasons = [
  "Spam",
  "Harassment or bullying",
  "Hate speech",
  "Violence or threats",
  "Misinformation",
  "Adult content",
  "Copyright violation",
  "Other",
]

export function BlockReportDialog({
  isOpen,
  onClose,
  type,
  userId,
  postId,
  username,
  onSuccess,
}: BlockReportDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [reason, setReason] = useState("")
  const [customReason, setCustomReason] = useState("")
  const [error, setError] = useState("")

  const handleSubmit = async () => {
    setIsLoading(true)
    setError("")

    try {
      if (type === "block" && userId) {
        const { error } = await supabase.from("blocks").insert({
          blocker_id: (await supabase.auth.getUser()).data.user?.id,
          blocked_id: userId,
        })

        if (error) throw error
      } else if (type === "report") {
        const finalReason = reason === "Other" ? customReason : reason

        if (!finalReason.trim()) {
          setError("Please provide a reason for the report")
          setIsLoading(false)
          return
        }

        const { error } = await supabase.from("reports").insert({
          reporter_id: (await supabase.auth.getUser()).data.user?.id,
          reported_post_id: postId || null,
          reported_user_id: userId || null,
          reason: finalReason,
        })

        if (error) throw error
      }

      onSuccess?.()
      onClose()
    } catch (err: any) {
      setError(err.message || "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{type === "block" ? `Block @${username}?` : "Report Content"}</DialogTitle>
          <DialogDescription>
            {type === "block"
              ? "They won't be able to follow you or see your posts, and you won't see posts from them."
              : "Help us understand what's happening with this content."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {type === "report" && (
            <>
              <div className="space-y-3">
                <Label>Why are you reporting this?</Label>
                <RadioGroup value={reason} onValueChange={setReason}>
                  {reportReasons.map((reportReason) => (
                    <div key={reportReason} className="flex items-center space-x-2">
                      <RadioGroupItem value={reportReason} id={reportReason} />
                      <Label htmlFor={reportReason} className="text-sm">
                        {reportReason}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              {reason === "Other" && (
                <div className="space-y-2">
                  <Label htmlFor="customReason">Please specify</Label>
                  <Textarea
                    id="customReason"
                    placeholder="Describe the issue..."
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    rows={3}
                  />
                </div>
              )}
            </>
          )}

          {error && <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{error}</div>}

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isLoading || (type === "report" && !reason)}
              variant={type === "block" ? "destructive" : "default"}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {type === "block" ? "Block" : "Report"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
