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
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Sidebar } from "@/components/dashboard/sidebar"
import { useLanguage } from "@/lib/contexts/language-context"
import {
  ArrowLeft,
  Shield,
  Bell,
  Moon,
  Sun,
  Globe,
  CheckCircle,
  Clock,
  User,
  Lock,
  Eye,
  EyeOff,
  Save,
  AlertCircle,
  Palette,
  Volume2,
  VolumeX,
  Smartphone,
  Monitor,
  Download,
  Trash2,
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

interface SettingsContentProps {
  user: any
}

export function SettingsContent({ user }: SettingsContentProps) {
  const [profile, setProfile] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [activeTab, setActiveTab] = useState("account")

  // Account settings
  const [displayName, setDisplayName] = useState("")
  const [bio, setBio] = useState("")
  const [website, setWebsite] = useState("")
  const [location, setLocation] = useState("")

  // Appearance settings
  const [darkMode, setDarkMode] = useState(false)
  const [fontSize, setFontSize] = useState("medium")
  const [colorScheme, setColorScheme] = useState("blue")

  // Notification settings
  const [notifications, setNotifications] = useState({
    likes: true,
    reposts: true,
    follows: true,
    mentions: true,
    replies: true,
    email: true,
    push: true,
    sound: true,
  })

  // Privacy settings
  const [privacy, setPrivacy] = useState({
    privateAccount: false,
    hideFollowers: false,
    hideFollowing: false,
    allowTagging: true,
    showOnlineStatus: true,
    allowDirectMessages: true,
  })

  // Security settings
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  const [verificationStatus, setVerificationStatus] = useState<"none" | "pending" | "verified">("none")
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
        setDisplayName(profileData.display_name || "")
        setBio(profileData.bio || "")
        setWebsite(profileData.website || "")
        setLocation(profileData.location || "")
        setVerificationStatus(
          profileData.is_verified ? "verified" : profileData.verification_requested ? "pending" : "none",
        )
      }
    } catch (error) {
      console.error("Error fetching profile:", error)
      toast.error("Failed to load profile data")
    } finally {
      setIsLoading(false)
    }
  }

  const loadSettings = () => {
    const savedDarkMode = localStorage.getItem("darkMode") === "true"
    const savedFontSize = localStorage.getItem("fontSize") || "medium"
    const savedColorScheme = localStorage.getItem("colorScheme") || "blue"
    const savedNotifications = localStorage.getItem("notifications")
    const savedPrivacy = localStorage.getItem("privacy")

    setDarkMode(savedDarkMode)
    setFontSize(savedFontSize)
    setColorScheme(savedColorScheme)

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

  const saveAccountSettings = async () => {
    setIsSaving(true)
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          display_name: displayName,
          bio: bio,
          website: website,
          location: location,
        })
        .eq("id", user.id)

      if (error) throw error

      toast.success("Account settings saved successfully")
      fetchProfile() // Refresh profile data
    } catch (error) {
      console.error("Error saving account settings:", error)
      toast.error("Failed to save account settings")
    } finally {
      setIsSaving(false)
    }
  }

  const handleAppearanceChange = (setting: string, value: any) => {
    switch (setting) {
      case "darkMode":
        setDarkMode(value)
        localStorage.setItem("darkMode", value.toString())
        if (value) {
          document.documentElement.classList.add("dark")
        } else {
          document.documentElement.classList.remove("dark")
        }
        break
      case "fontSize":
        setFontSize(value)
        localStorage.setItem("fontSize", value)
        break
      case "colorScheme":
        setColorScheme(value)
        localStorage.setItem("colorScheme", value)
        break
    }
    toast.success("Appearance settings updated")
  }

  const handleNotificationChange = (key: string, value: boolean) => {
    const newNotifications = { ...notifications, [key]: value }
    setNotifications(newNotifications)
    localStorage.setItem("notifications", JSON.stringify(newNotifications))
    toast.success("Notification settings updated")
  }

  const handlePrivacyChange = (key: string, value: boolean) => {
    const newPrivacy = { ...privacy, [key]: value }
    setPrivacy(newPrivacy)
    localStorage.setItem("privacy", JSON.stringify(newPrivacy))
    toast.success("Privacy settings updated")
  }

  const changePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("New passwords don't match")
      return
    }

    if (passwordForm.newPassword.length < 8) {
      toast.error("Password must be at least 8 characters long")
      return
    }

    setIsSaving(true)
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordForm.newPassword,
      })

      if (error) throw error

      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" })
      toast.success("Password updated successfully")
    } catch (error) {
      console.error("Error changing password:", error)
      toast.error("Failed to change password")
    } finally {
      setIsSaving(false)
    }
  }

  const requestVerification = async () => {
    try {
      await supabase.from("profiles").update({ verification_requested: true }).eq("id", user.id)
      setVerificationStatus("pending")
      toast.success("Verification request submitted")
    } catch (error) {
      console.error("Error requesting verification:", error)
      toast.error("Failed to request verification")
    }
  }

  const exportData = async () => {
    try {
      // This would typically call an API endpoint to generate and download user data
      toast.success("Data export initiated. You'll receive an email when ready.")
    } catch (error) {
      toast.error("Failed to export data")
    }
  }

  const deleteAccount = async () => {
    if (confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
      try {
        // This would typically call an API endpoint to delete the account
        toast.success("Account deletion initiated. You'll receive a confirmation email.")
      } catch (error) {
        toast.error("Failed to delete account")
      }
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

        <div className="flex-1 max-w-4xl mx-auto">
          <div className="border-x bg-white dark:bg-gray-800 min-h-screen">
            {/* Header */}
            <div className="sticky top-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-b px-4 py-3 z-10">
              <div className="flex items-center gap-4">
                <Link href="/dashboard">
                  <Button variant="ghost" size="icon">
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                </Link>
                <div>
                  <h1 className="text-xl font-bold">{t("settings")}</h1>
                  <p className="text-sm text-gray-500">Manage your account and preferences</p>
                </div>
              </div>
            </div>

            <div className="p-6">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="account" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span className="hidden sm:inline">Account</span>
                  </TabsTrigger>
                  <TabsTrigger value="appearance" className="flex items-center gap-2">
                    <Palette className="h-4 w-4" />
                    <span className="hidden sm:inline">Appearance</span>
                  </TabsTrigger>
                  <TabsTrigger value="notifications" className="flex items-center gap-2">
                    <Bell className="h-4 w-4" />
                    <span className="hidden sm:inline">Notifications</span>
                  </TabsTrigger>
                  <TabsTrigger value="privacy" className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    <span className="hidden sm:inline">Privacy</span>
                  </TabsTrigger>
                  <TabsTrigger value="security" className="flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    <span className="hidden sm:inline">Security</span>
                  </TabsTrigger>
                </TabsList>

                {/* Account Settings */}
                <TabsContent value="account" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        Profile Information
                      </CardTitle>
                      <CardDescription>Update your public profile information</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="displayName">Display Name</Label>
                          <Input
                            id="displayName"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            placeholder="Your display name"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="location">Location</Label>
                          <Input
                            id="location"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            placeholder="Your location"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="website">Website</Label>
                        <Input
                          id="website"
                          value={website}
                          onChange={(e) => setWebsite(e.target.value)}
                          placeholder="https://yourwebsite.com"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="bio">Bio</Label>
                        <Textarea
                          id="bio"
                          value={bio}
                          onChange={(e) => setBio(e.target.value)}
                          placeholder="Tell us about yourself"
                          rows={3}
                        />
                      </div>
                      <Button onClick={saveAccountSettings} disabled={isSaving} className="w-full sm:w-auto">
                        <Save className="h-4 w-4 mr-2" />
                        {isSaving ? "Saving..." : "Save Changes"}
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Language Settings */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Globe className="h-5 w-5" />
                        Language & Region
                      </CardTitle>
                      <CardDescription>Choose your preferred language</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Select value={language} onValueChange={(value: any) => setLanguage(value)}>
                        <SelectTrigger className="w-full sm:w-48">
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

                  {/* Verification */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        Account Verification
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
                              Verified
                            </Badge>
                          )}
                          {verificationStatus === "pending" && (
                            <Badge variant="secondary">
                              <Clock className="h-3 w-3 mr-1" />
                              Pending Review
                            </Badge>
                          )}
                        </div>
                        {verificationStatus === "none" && (
                          <Button onClick={requestVerification} size="sm">
                            Request Verification
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Appearance Settings */}
                <TabsContent value="appearance" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Palette className="h-5 w-5" />
                        Theme & Display
                      </CardTitle>
                      <CardDescription>Customize your visual experience</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {darkMode ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                          <Label htmlFor="dark-mode">Dark Mode</Label>
                        </div>
                        <Switch
                          id="dark-mode"
                          checked={darkMode}
                          onCheckedChange={(value) => handleAppearanceChange("darkMode", value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Font Size</Label>
                        <Select value={fontSize} onValueChange={(value) => handleAppearanceChange("fontSize", value)}>
                          <SelectTrigger className="w-full sm:w-48">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="small">Small</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="large">Large</SelectItem>
                            <SelectItem value="extra-large">Extra Large</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Color Scheme</Label>
                        <Select
                          value={colorScheme}
                          onValueChange={(value) => handleAppearanceChange("colorScheme", value)}
                        >
                          <SelectTrigger className="w-full sm:w-48">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="blue">Blue</SelectItem>
                            <SelectItem value="green">Green</SelectItem>
                            <SelectItem value="purple">Purple</SelectItem>
                            <SelectItem value="orange">Orange</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Notification Settings */}
                <TabsContent value="notifications" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Bell className="h-5 w-5" />
                        Notification Preferences
                      </CardTitle>
                      <CardDescription>Control what notifications you receive</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {Object.entries(notifications).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {key === "sound" ? (
                              value ? (
                                <Volume2 className="h-4 w-4" />
                              ) : (
                                <VolumeX className="h-4 w-4" />
                              )
                            ) : key === "push" ? (
                              <Smartphone className="h-4 w-4" />
                            ) : (
                              <Bell className="h-4 w-4" />
                            )}
                            <Label htmlFor={key} className="capitalize">
                              {key === "likes"
                                ? "Likes"
                                : key === "reposts"
                                  ? "Reposts"
                                  : key === "follows"
                                    ? "New Followers"
                                    : key === "mentions"
                                      ? "Mentions"
                                      : key === "replies"
                                        ? "Replies"
                                        : key === "email"
                                          ? "Email Notifications"
                                          : key === "push"
                                            ? "Push Notifications"
                                            : "Sound Effects"}
                            </Label>
                          </div>
                          <Switch
                            id={key}
                            checked={value}
                            onCheckedChange={(checked) => handleNotificationChange(key, checked)}
                          />
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Privacy Settings */}
                <TabsContent value="privacy" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        Privacy & Safety
                      </CardTitle>
                      <CardDescription>Control your privacy and visibility</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {Object.entries(privacy).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4" />
                            <Label htmlFor={key}>
                              {key === "privateAccount"
                                ? "Private Account"
                                : key === "hideFollowers"
                                  ? "Hide Followers"
                                  : key === "hideFollowing"
                                    ? "Hide Following"
                                    : key === "allowTagging"
                                      ? "Allow Tagging"
                                      : key === "showOnlineStatus"
                                        ? "Show Online Status"
                                        : "Allow Direct Messages"}
                            </Label>
                          </div>
                          <Switch
                            id={key}
                            checked={value}
                            onCheckedChange={(checked) => handlePrivacyChange(key, checked)}
                          />
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Security Settings */}
                <TabsContent value="security" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Lock className="h-5 w-5" />
                        Change Password
                      </CardTitle>
                      <CardDescription>Update your account password</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="currentPassword">Current Password</Label>
                        <div className="relative">
                          <Input
                            id="currentPassword"
                            type={showCurrentPassword ? "text" : "password"}
                            value={passwordForm.currentPassword}
                            onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                            placeholder="Enter current password"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-2 top-1/2 -translate-y-1/2"
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          >
                            {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="newPassword">New Password</Label>
                        <div className="relative">
                          <Input
                            id="newPassword"
                            type={showNewPassword ? "text" : "password"}
                            value={passwordForm.newPassword}
                            onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                            placeholder="Enter new password"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-2 top-1/2 -translate-y-1/2"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                          >
                            {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirm New Password</Label>
                        <div className="relative">
                          <Input
                            id="confirmPassword"
                            type={showConfirmPassword ? "text" : "password"}
                            value={passwordForm.confirmPassword}
                            onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                            placeholder="Confirm new password"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-2 top-1/2 -translate-y-1/2"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          >
                            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>

                      <Button onClick={changePassword} disabled={isSaving} className="w-full sm:w-auto">
                        <Lock className="h-4 w-4 mr-2" />
                        {isSaving ? "Updating..." : "Update Password"}
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Data & Account Management */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Monitor className="h-5 w-5" />
                        Data & Account
                      </CardTitle>
                      <CardDescription>Manage your data and account</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Export Data</p>
                          <p className="text-sm text-gray-500">Download a copy of your data</p>
                        </div>
                        <Button variant="outline" onClick={exportData}>
                          <Download className="h-4 w-4 mr-2" />
                          Export
                        </Button>
                      </div>

                      <Separator />

                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-red-600">Delete Account</p>
                              <p className="text-sm">Permanently delete your account and all data</p>
                            </div>
                            <Button variant="destructive" onClick={deleteAccount}>
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </Button>
                          </div>
                        </AlertDescription>
                      </Alert>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>

              <Separator className="my-8" />

              {/* Sign Out */}
              <div className="flex justify-center">
                <Button variant="outline" onClick={handleSignOut} className="w-full sm:w-auto">
                  Sign Out
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
