"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Sidebar } from "@/components/dashboard/sidebar"
import { useLanguage } from "@/lib/contexts/language-context"
import { ArrowLeft, Shield, Bell, Moon, Sun, Globe, CheckCircle, Clock } from "lucide-react"
import Link from "next/link"

interface SettingsContentProps {
  user: any
}

export function SettingsContent({ user }: SettingsContentProps) {
  const [profile, setProfile] = useState<any>(null)
  const [darkMode, setDarkMode] = useState(false)
  const [notifications, setNotifications] = useState({
    likes: true,
    reposts: true,
    follows: true,
    mentions: true,
    replies: true,
  })
  const [privacy, setPrivacy] = useState({
    privateAccount: false,
    hideFollowers: false,
    hideFollowing: false,
  })
  const [verificationStatus, setVerificationStatus] = useState<"none" | "pending" | "verified">("none")
  const [isLoading, setIsLoading] = useState(true)
  const { language, setLanguage, t } = useLanguage()
  const router = useRouter()

  useEffect(() => {
    fetchProfile()
    loadSettings()
  }, [])

  const fetchProfile = async () => {
    try {
      const { data: profileData } = await supabase.from("profiles").select("*").eq("id", user.id).single()

      if (profileData) {
        setProfile(profileData)
        setVerificationStatus(
          profileData.is_verified ? "verified" : profileData.verification_requested ? "pending" : "none",
        )
      }
    } catch (error) {
      console.error("Error fetching profile:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadSettings = () => {
    const savedDarkMode = localStorage.getItem("darkMode") === "true"
    const savedNotifications = localStorage.getItem("notifications")
    const savedPrivacy = localStorage.getItem("privacy")

    setDarkMode(savedDarkMode)
    if (savedNotifications) {
      setNotifications(JSON.parse(savedNotifications))
    }
    if (savedPrivacy) {
      setPrivacy(JSON.parse(savedPrivacy))
    }

    // Apply dark mode
    if (savedDarkMode) {
      document.documentElement.classList.add("dark")
    }
  }

  const handleDarkModeToggle = (enabled: boolean) => {
    setDarkMode(enabled)
    localStorage.setItem("darkMode", enabled.toString())

    if (enabled) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }

  const handleNotificationChange = (key: string, value: boolean) => {
    const newNotifications = { ...notifications, [key]: value }
    setNotifications(newNotifications)
    localStorage.setItem("notifications", JSON.stringify(newNotifications))
  }

  const handlePrivacyChange = (key: string, value: boolean) => {
    const newPrivacy = { ...privacy, [key]: value }
    setPrivacy(newPrivacy)
    localStorage.setItem("privacy", JSON.stringify(newPrivacy))
  }

  const requestVerification = async () => {
    try {
      await supabase.from("profiles").update({ verification_requested: true }).eq("id", user.id)

      setVerificationStatus("pending")
    } catch (error) {
      console.error("Error requesting verification:", error)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/")
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex">
        <div className="hidden lg:block w-64 bg-white dark:bg-gray-800 border-r">
          <Sidebar profile={profile} onSignOut={handleSignOut} />
        </div>

        <div className="flex-1 max-w-2xl mx-auto">
          <div className="border-x bg-white dark:bg-gray-800 min-h-screen">
            {/* Header */}
            <div className="sticky top-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-b px-4 py-3">
              <div className="flex items-center gap-4">
                <Link href="/dashboard">
                  <Button variant="ghost" size="icon">
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                </Link>
                <h1 className="text-xl font-bold">{t("settings")}</h1>
              </div>
            </div>

            <div className="p-4 space-y-6">
              {/* Language Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    {t("language")}
                  </CardTitle>
                  <CardDescription>Choose your preferred language</CardDescription>
                </CardHeader>
                <CardContent>
                  <Select value={language} onValueChange={(value: any) => setLanguage(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="bn">বাংলা</SelectItem>
                      <SelectItem value="hi">हिन्दी</SelectItem>
                      <SelectItem value="ar">العربية</SelectItem>
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              {/* Theme Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {darkMode ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                    {t("theme")}
                  </CardTitle>
                  <CardDescription>Customize your visual experience</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="dark-mode">Dark Mode</Label>
                    <Switch id="dark-mode" checked={darkMode} onCheckedChange={handleDarkModeToggle} />
                  </div>
                </CardContent>
              </Card>

              {/* Verification */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    {t("verification")}
                  </CardTitle>
                  <CardDescription>Get verified to show authenticity</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span>Verification Status</span>
                      {verificationStatus === "verified" && (
                        <Badge variant="default" className="bg-blue-500">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          {t("verified")}
                        </Badge>
                      )}
                      {verificationStatus === "pending" && (
                        <Badge variant="secondary">
                          <Clock className="h-3 w-3 mr-1" />
                          {t("verificationPending")}
                        </Badge>
                      )}
                    </div>
                    {verificationStatus === "none" && (
                      <Button onClick={requestVerification} size="sm">
                        {t("requestVerification")}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Notification Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    {t("notifications_settings")}
                  </CardTitle>
                  <CardDescription>Control what notifications you receive</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {Object.entries(notifications).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between">
                      <Label htmlFor={key} className="capitalize">
                        {key === "likes"
                          ? "Likes"
                          : key === "reposts"
                            ? "Reposts"
                            : key === "follows"
                              ? "New Followers"
                              : key === "mentions"
                                ? "Mentions"
                                : "Replies"}
                      </Label>
                      <Switch
                        id={key}
                        checked={value}
                        onCheckedChange={(checked) => handleNotificationChange(key, checked)}
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Privacy Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    {t("privacy")}
                  </CardTitle>
                  <CardDescription>Control your privacy and visibility</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {Object.entries(privacy).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between">
                      <Label htmlFor={key}>
                        {key === "privateAccount"
                          ? "Private Account"
                          : key === "hideFollowers"
                            ? "Hide Followers"
                            : "Hide Following"}
                      </Label>
                      <Switch
                        id={key}
                        checked={value}
                        onCheckedChange={(checked) => handlePrivacyChange(key, checked)}
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Separator />

              {/* Sign Out */}
              <div className="flex justify-center">
                <Button variant="destructive" onClick={handleSignOut}>
                  {t("signOut")}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
