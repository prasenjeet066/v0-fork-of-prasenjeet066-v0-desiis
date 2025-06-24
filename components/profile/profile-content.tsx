"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Sidebar } from "@/components/dashboard/sidebar"
import { PostCard } from "@/components/dashboard/post-card"
import { EditProfileDialog } from "./edit-profile-dialog"
import { Menu, X, UserPlus, UserCheck, Calendar, MapPin, LinkIcon } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { bn } from "date-fns/locale"
import Link from "next/link"
import { VerificationBadge } from "@/components/badge/verification-badge"
interface ProfileContentProps {
  username: string
  currentUserId: string | null
}

interface ProfileData {
  id: string
  username: string
  display_name: string
  bio: string | null
  avatar_url: string | null
  cover_url: string | null
  website: string | null
  location: string | null
  created_at: string
  posts_count: number
  is_verified: boolean 
  followers_count: number
  following_count: number
  is_following: boolean
}

interface Post {
  id: string
  content: string
  created_at: string
  user_id: string
  username: string
  display_name: string
  avatar_url: string | null
  likes_count: number
  is_liked: boolean
  reposts_count: number
  is_reposted: boolean
  reply_to: string | null
  media_urls: string[] | null
  media_type: string | null
  is_repost: boolean
  repost_user_id: string | null
  repost_username: string | null
  repost_display_name: string | null
  repost_created_at: string | null
}

export function ProfileContent({ username, currentUserId }: ProfileContentProps) {
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [currentProfile, setCurrentProfile] = useState<any>(null)
  const [profileData, setProfileData] = useState<ProfileData | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [replies, setReplies] = useState<Post[]>([])
  const [reposts, setReposts] = useState<Post[]>([])
  const [media, setMedia] = useState<Post[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("posts")
  const router = useRouter()

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get current user profile if logged in
        if (currentUserId) {
          const { data: currentUserData } = await supabase.auth.getUser()
          if (currentUserData.user) {
            setCurrentUser(currentUserData.user)
            const { data: currentProfileData } = await supabase
              .from("profiles")
              .select("*")
              .eq("id", currentUserData.user.id)
              .single()
            setCurrentProfile(currentProfileData)
          }
        }

        // Get profile data
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("username", username)
          .single()

        if (profileError || !profile) {
          router.push("/")
          return
        }

        // Get user stats
        const { data: stats } = await supabase.rpc("get_user_stats", {
          user_uuid: profile.id,
        })

        // Check if current user is following this profile (only if logged in)
        let isFollowing = false
        if (currentUserId) {
          const { data: followData } = await supabase
            .from("follows")
            .select("id")
            .eq("follower_id", currentUserId)
            .eq("following_id", profile.id)
            .single()
          isFollowing = !!followData
        }

        const profileWithStats: ProfileData = {
          ...profile,
          posts_count: stats?.[0]?.posts_count || 0,
          followers_count: stats?.[0]?.followers_count || 0,
          following_count: stats?.[0]?.following_count || 0,
          is_following: isFollowing,
        }

        setProfileData(profileWithStats)

        // Get user posts
        const { data: postsData, error: postsError } = await supabase
          .from("posts")
          .select(`
            id,
            content,
            created_at,
            user_id,
            media_urls,
    media_type,
            reply_to
          `)
          .eq("user_id", profile.id)
          .is("reply_to", null)
          .order("created_at", { ascending: false })
          .limit(20)

        // Get user replies
        const { data: repliesData } = await supabase
          .from("posts")
          .select(`
            id,
            content,
            created_at,
            user_id,
            media_urls,
    media_type,
            reply_to
          `)
          .eq("user_id", profile.id)
          .not("reply_to", "is", null)
          .order("created_at", { ascending: false })
          .limit(20)

        // Get user reposts
        const { data: repostsData } = await supabase
          .from("reposts")
          .select(`
            post_id,
            created_at,
            
            posts!inner(
              id,
              content,
              media_urls,
    media_type,
              created_at,
              user_id,
              reply_to
            )
          `)
          .eq("user_id", profile.id)
          .order("created_at", { ascending: false })
          .limit(20)

        if (!postsError && postsData) {
          const formattedPosts = await formatPosts(postsData, profile)
          setPosts(formattedPosts)
        }

        if (repliesData) {
          const formattedReplies = await formatPosts(repliesData, profile)
          setReplies(formattedReplies)
        }

        if (repostsData) {
          const repostPosts = repostsData.map((r) => r.posts).filter(Boolean)
          const formattedReposts = await formatPosts(repostPosts, profile)
          setReposts(formattedReposts)
        }

        // For now, media is empty since we don't have media support yet
        setMedia([])
      } catch (error) {
        console.error("Error fetching profile data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [username, currentUserId, router])

  const formatPosts = async (postsData: any[], profile: any) => {
    const postIds = postsData?.map((p) => p.id) || []
    const [likesData, repostsData] = await Promise.all([
      supabase.from("likes").select("post_id, user_id").in("post_id", postIds),
      supabase.from("reposts").select("post_id, user_id").in("post_id", postIds),
    ])

    const likesMap = new Map()
    const userLikesSet = new Set()
    const repostsMap = new Map()
    const userRepostsSet = new Set()

    likesData.data?.forEach((like) => {
      likesMap.set(like.post_id, (likesMap.get(like.post_id) || 0) + 1)
      if (like.user_id === currentUserId) {
        userLikesSet.add(like.post_id)
      }
    })

    repostsData.data?.forEach((repost) => {
      repostsMap.set(repost.post_id, (repostsMap.get(repost.post_id) || 0) + 1)
      if (repost.user_id === currentUserId) {
        userRepostsSet.add(repost.post_id)
      }
    })

    return (
      postsData?.map((post) => ({
        id: post.id,
        content: post.content,
        created_at: post.created_at,
        user_id: post.user_id,
        username: profile.username,
        display_name: profile.display_name,
        avatar_url: profile.avatar_url,
        likes_count: likesMap.get(post.id) || 0,
        is_liked: userLikesSet.has(post.id),
        reposts_count: repostsMap.get(post.id) || 0,
        is_reposted: userRepostsSet.has(post.id),
        reply_to: post.reply_to,
        media_urls: post.media_urls,
        media_type: post.media_type,
        is_repost: false,
        repost_user_id: null,
        repost_username: null,
        repost_display_name: null,
        repost_created_at: null,
      })) || []
    )
  }

  const handleFollow = async () => {
    if (!profileData || !currentUserId) return

    if (profileData.is_following) {
      await supabase.from("follows").delete().eq("follower_id", currentUserId).eq("following_id", profileData.id)
    } else {
      await supabase.from("follows").insert({ follower_id: currentUserId, following_id: profileData.id })
    }

    setProfileData({
      ...profileData,
      is_following: !profileData.is_following,
      followers_count: profileData.followers_count + (profileData.is_following ? -1 : 1),
    })
  }

  const handleLike = async (postId: string, isLiked: boolean) => {
    if (!currentUserId) return

    if (isLiked) {
      await supabase.from("likes").delete().eq("post_id", postId).eq("user_id", currentUserId)
    } else {
      await supabase.from("likes").insert({ post_id: postId, user_id: currentUserId })
    }

    const updatePosts = (postsList: Post[]) =>
      postsList.map((post) =>
        post.id === postId ? { ...post, is_liked: !isLiked, likes_count: post.likes_count + (isLiked ? -1 : 1) } : post,
      )

    setPosts(updatePosts)
    setReplies(updatePosts)
    setReposts(updatePosts)
  }

  const handleRepost = async (postId: string, isReposted: boolean) => {
    if (!currentUserId) return

    if (isReposted) {
      await supabase.from("reposts").delete().eq("post_id", postId).eq("user_id", currentUserId)
    } else {
      await supabase.from("reposts").insert({ post_id: postId, user_id: currentUserId })
    }

    const updatePosts = (postsList: Post[]) =>
      postsList.map((post) =>
        post.id === postId
          ? { ...post, is_reposted: !isReposted, reposts_count: post.reposts_count + (isReposted ? -1 : 1) }
          : post,
      )

    setPosts(updatePosts)
    setReplies(updatePosts)
    setReposts(updatePosts)
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

  if (!profileData) {
    return (
      <div className="min-h-screen flex items-center justify-center bengali-font">
        <div className="text-center">
          <p className="text-xl mb-4">প্রোফাইল পাওয়া যায়নি</p>
          <Link href="/">
            <Button>হোমে ফিরে যান</Button>
          </Link>
        </div>
      </div>
    )
  }

  const isOwnProfile = profileData.id === currentUserId

  const renderTabContent = (tabPosts: Post[], emptyMessage: string) => (
    <div>
      {tabPosts.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>{emptyMessage}</p>
        </div>
      ) : (
        tabPosts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            currentUserId={currentUserId || ""}
            onLike={handleLike}
            onRepost={handleRepost}
          />
        ))
      )}
    </div>
  )
  //const isVerified = profileData?.is_verified || false;
  return (
    <div className="min-h-screen bg-gray-50 bengali-font">
      {/* Mobile header */}
      <div className="lg:hidden bg-white border-b px-4 py-3 flex items-center justify-between">
        <h1 className="text-xl font-bold logo-font">desiiseb</h1>
        <div className="flex items-center gap-2">
          {currentUserId && (
            <>
              <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)}>
                {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
              <Button variant="ghost" size="icon" asChild>
                <Link href={`/profile/${currentProfile?.username}`}>
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={currentProfile?.avatar_url || undefined} />
                    <AvatarFallback className="text-xs">
                      {currentProfile?.display_name?.charAt(0)?.toUpperCase() || "ব"}
                    </AvatarFallback>
                  </Avatar>
                </Link>
              </Button>
            </>
          )}
          {!currentUserId && (
            <Link href="/auth/sign-in">
              <Button size="sm">সাইন ইন</Button>
            </Link>
          )}
        </div>
      </div>

      <div className="flex">
        {/* Sidebar - only show if logged in */}
        {currentUserId && currentProfile && (
          <div
            className={`${sidebarOpen ? "block" : "hidden"} lg:block fixed lg:relative inset-y-0 left-0 z-50 w-64 bg-white border-r lg:border-r-0`}
          >
            <Sidebar profile={currentProfile} onSignOut={handleSignOut} />
          </div>
        )}

        {/* Main content */}
        <div className="flex-1 max-w-2xl mx-auto">
          <div className="border-x bg-white min-h-screen">
            <div className="sticky top-0 bg-white/50 z-50 backdrop-blur-md border-b px-4 py-3">
              <h2 className="text-xl font-bold">{profileData.display_name}</h2>
              <p className="text-sm text-gray-500">{profileData.posts_count} পোস্ট</p>
            </div>

            {/* Cover Image - Not rounded */}
            <div className="relative">
              <div
                className="w-full h-48 bg-gradient-to-r from-blue-400 to-purple-500"
                style={{
                  backgroundImage: profileData.cover_url ? `url(${profileData.cover_url})` : undefined,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              />
            </div>

            {/* Profile Header */}
            <div className="p-4 border-b relative">
              <div className="flex items-start justify-between mb-4">
                <Avatar className="w-20 h-20 -mt-10 border-4 border-white">
                  <AvatarImage src={profileData.avatar_url || undefined} />
                  <AvatarFallback className="text-2xl">
                    {profileData.display_name?.charAt(0)?.toUpperCase() || "ব"}
                  </AvatarFallback>
                </Avatar>

                <div className="flex gap-2">
                  {isOwnProfile ? (
                    <Button variant="outline" onClick={() => setEditDialogOpen(true)}>
                      প্রোফাইল সম্পাদনা
                    </Button>
                  ) : currentUserId ? (
                    <Button variant={profileData.is_following ? "outline" : "default"} onClick={handleFollow}>
                      {profileData.is_following ? (
                        <>
                          <UserCheck className="h-4 w-4 mr-1" />
                          অনুসরণ করছেন
                        </>
                      ) : (
                        <>
                          <UserPlus className="h-4 w-4 mr-1" />
                          অনুসরণ করুন
                        </>
                      )}
                    </Button>
                  ) : (
                    <Link href="/auth/sign-in">
                      <Button>
                        <UserPlus className="h-4 w-4 mr-1" />
                        অনুসরণ করুন
                      </Button>
                    </Link>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <h1 className="text-xl font-bold">{profileData.display_name} </h1>
                <p className="text-gray-500">@{profileData.username}</p>

                {profileData.bio && <p className="text-gray-900">{profileData.bio}</p>}

                <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                  {profileData.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {profileData.location}
                    </div>
                  )}
                  {profileData.website && (
                    <div className="flex items-center gap-1">
                      <LinkIcon className="h-4 w-4" />
                      <a
                        href={profileData.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {profileData.website}
                      </a>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {formatDistanceToNow(new Date(profileData.created_at), { addSuffix: true, locale: bn })} যোগ দিয়েছেন
                  </div>
                </div>

                <div className="flex gap-4 text-sm">
                  <span>
                    <strong>{profileData.following_count}</strong> অনুসরণ করছেন
                  </span>
                  <span>
                    <strong>{profileData.followers_count}</strong> অনুসরণকারী
                  </span>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4 bg-white border-b rounded-none h-12">
                <TabsTrigger
                  value="posts"
                  className="data-[state=active]:border-b-2 data-[state=active]:border-blue-500 rounded-none"
                >
                  পোস্ট
                </TabsTrigger>
                <TabsTrigger
                  value="replies"
                  className="data-[state=active]:border-b-2 data-[state=active]:border-blue-500 rounded-none"
                >
                  উত্তর
                </TabsTrigger>
                <TabsTrigger
                  value="reposts"
                  className="data-[state=active]:border-b-2 data-[state=active]:border-blue-500 rounded-none"
                >
                  রিপোস্ট
                </TabsTrigger>
                <TabsTrigger
                  value="media"
                  className="data-[state=active]:border-b-2 data-[state=active]:border-blue-500 rounded-none"
                >
                  মিডিয়া
                </TabsTrigger>
              </TabsList>

              <TabsContent value="posts" className="mt-0">
                {renderTabContent(posts, "এখনো কোনো পোস্ট নেই")}
              </TabsContent>

              <TabsContent value="replies" className="mt-0">
                {renderTabContent(replies, "এখনো কোনো উত্তর নেই")}
              </TabsContent>

              <TabsContent value="reposts" className="mt-0">
                {renderTabContent(reposts, "এখনো কোনো রিপোস্ট নেই")}
              </TabsContent>

              <TabsContent value="media" className="mt-0">
                {renderTabContent(media, "এখনো কোনো মিডিয়া নেই")}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Edit Profile Dialog - only show if own profile */}
      {isOwnProfile && (
        <EditProfileDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          profile={profileData}
          onProfileUpdate={(updatedProfile) => {
            setProfileData({ ...profileData, ...updatedProfile })
            if (currentProfile) {
              setCurrentProfile({ ...currentProfile, ...updatedProfile })
            }
          }}
        />
      )}
    </div>
  )
}
