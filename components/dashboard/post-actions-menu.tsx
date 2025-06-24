"use client"

import { useState } from "react"
import { MoreHorizontal, Edit, Trash2, Flag, UserX } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { supabase } from "@/lib/supabase/client"
import { useRouter } from 'next/router';
interface PostActionsMenuProps {
  post: any
  currentUserId: string
  onPostUpdated?: () => void
  onPostDeleted?: () => void
}

export function PostActionsMenu({ post, currentUserId, onPostUpdated, onPostDeleted }: PostActionsMenuProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showReportDialog, setShowReportDialog] = useState(false)
  const [showBlockDialog, setShowBlockDialog] = useState(false)
  const [showReportUserDialog, setShowReportUserDialog] = useState(false)
  const [editContent, setEditContent] = useState(post.content)
  const [reportReason, setReportReason] = useState("")
  const [reportUserReason, setReportUserReason] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  
// or for react-router-dom: import { useLocation } from 'react-router-dom';

  

  const handleDelete = async () => {
    setIsLoading(true)
    try {
      const { error } = await supabase.from("posts").delete().eq("id", post.id).eq("user_id", currentUserId)

      if (!error) {
        onPostDeleted?.()
        setShowDeleteDialog(false)
      }
    } catch (error) {
      console.error("Error deleting post:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = async () => {
    if (!editContent.trim()) return

    setIsLoading(true)
    try {
      const { error } = await supabase
        .from("posts")
        .update({
          content: editContent.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", post.id)
        .eq("user_id", currentUserId)

      if (!error) {
        onPostUpdated?.()
        setShowEditDialog(false)
      }
    } catch (error) {
      console.error("Error updating post:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleReport = async () => {
    if (!reportReason.trim()) return

    setIsLoading(true)
    try {
      const { error } = await supabase.from("reports").insert({
        reporter_id: currentUserId,
        reported_post_id: post.id,
        reported_user_id: post.user_id,
        reason: reportReason.trim(),
        type: "post",
      })

      if (!error) {
        setShowReportDialog(false)
        setReportReason("")
      }
    } catch (error) {
      console.error("Error reporting post:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleReportUser = async () => {
    if (!reportUserReason.trim()) return

    setIsLoading(true)
    try {
      const { error } = await supabase.from("reports").insert({
        reporter_id: currentUserId,
        reported_user_id: post.user_id,
        reason: reportUserReason.trim(),
        type: "user",
      })

      if (!error) {
        setShowReportUserDialog(false)
        setReportUserReason("")
      }
    } catch (error) {
      console.error("Error reporting user:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleBlock = async () => {
    setIsLoading(true)
    try {
      const { error } = await supabase.from("blocks").insert({
        blocker_id: currentUserId,
        blocked_id: post.user_id,
      })

      if (!error) {
        setShowBlockDialog(false)
        onPostUpdated?.()
      }
    } catch (error) {
      console.error("Error blocking user:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {isOwnPost ? (
            <>
              <DropdownMenuItem onClick={() => setShowEditDialog(true)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Post
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowDeleteDialog(true)} className="text-red-600">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Post
              </DropdownMenuItem>
            </>
          ) : (
            <>
              <DropdownMenuItem onClick={() => setShowReportDialog(true)}>
                <Flag className="mr-2 h-4 w-4" />
                Report Post
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowReportUserDialog(true)}>
                <Flag className="mr-2 h-4 w-4" />
                Report User
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setShowBlockDialog(true)} className="text-red-600">
                <UserX className="mr-2 h-4 w-4" />
                Block @{post.username}
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Post</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this post? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isLoading} className="bg-red-600 hover:bg-red-700">
              {isLoading ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Post</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              placeholder="What's happening?"
              className="min-h-[120px]"
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleEdit} disabled={isLoading || !editContent.trim()}>
                {isLoading ? "Updating..." : "Update Post"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Report Dialog */}
      <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report Post</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              placeholder="Please describe why you're reporting this post..."
              className="min-h-[120px]"
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowReportDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleReport}
                disabled={isLoading || !reportReason.trim()}
                className="bg-red-600 hover:bg-red-700"
              >
                {isLoading ? "Reporting..." : "Report"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Block Dialog */}
      <AlertDialog open={showBlockDialog} onOpenChange={setShowBlockDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Block @{post.username}</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to block @{post.username}? You won't see their posts and they won't be able to
              interact with you.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBlock} disabled={isLoading} className="bg-red-600 hover:bg-red-700">
              {isLoading ? "Blocking..." : "Block"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Report User Dialog */}
      <Dialog open={showReportUserDialog} onOpenChange={setShowReportUserDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report User @{post.username}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              value={reportUserReason}
              onChange={(e) => setReportUserReason(e.target.value)}
              placeholder="Please describe why you're reporting this user..."
              className="min-h-[120px]"
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowReportUserDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleReportUser}
                disabled={isLoading || !reportUserReason.trim()}
                className="bg-red-600 hover:bg-red-700"
              >
                {isLoading ? "Reporting..." : "Report User"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
