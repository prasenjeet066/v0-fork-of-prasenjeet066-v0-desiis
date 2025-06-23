"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Icons } from "@/components/icons"
import Link from "next/link"

export default function SignInPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const onSubmit = async (event: React.SyntheticEvent) => {
    event.preventDefault()
    setIsLoading(true)

    // Simulate authentication delay
    await new Promise((resolve) => setTimeout(resolve, 1000))

    setIsLoading(false)
    toast({
      title: "Login Successful!",
      description: "Redirecting to dashboard...",
    })

    router.push("/dashboard")
  }

  return (
    <div className="container grid h-screen w-screen place-items-center">
      <Card className="w-[350px]">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl">সাইন ইন করুন</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="space-y-2">
            <Label htmlFor="email">ইমেইল</Label>
            <Input
              id="email"
              placeholder="আপনার ইমেইল লিখুন"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">পাসওয়ার্ড</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
              disabled={isLoading}
            />
            <div className="text-right">
              <Link href="/auth/forgot-password" className="text-sm text-blue-600 hover:underline">
                পাসওয়ার্ড ভুলে গেছেন?
              </Link>
            </div>
          </div>
          <Button disabled={isLoading} onClick={onSubmit}>
            {isLoading ? (
              <>
                <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                অপেক্ষা করুন...
              </>
            ) : (
              "সাইন ইন করুন"
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
