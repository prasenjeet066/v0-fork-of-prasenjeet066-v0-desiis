"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import type { User } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase/client"
import { CreatePost } from "@/components/dashboard/create-post"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

interface CreatePostPageProps {
  user: User
}

export function CreatePostPage({ user }: CreatePostPageProps) {
  const [profile, setProfile] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    fetchProfile()
  }, [user.id])

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).single()
      if (error) throw error
      setProfile(data)
    } catch (error) {
      console.error("Error fetching profile:", error)
    }
  }

  const handlePostCreated = () => {
    router.push("/dashboard")
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto border-x">
        {/* Header */}
        <div className="sticky top-0 bg-white/80 backdrop-blur-md border-b px-4 py-3 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold">Create Post</h1>
        </div>

        {/* Create Post Form */}
        <div className="p-4">
          <CreatePost userId={user.id} profile={profile} onPostCreated={handlePostCreated} />
        </div>
      </div>
    </div>
  )
}
