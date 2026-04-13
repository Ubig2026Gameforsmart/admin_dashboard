"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { cookies, headers } from "next/headers"
import { getSupabaseServerClient } from "@/lib/supabase-server"

export async function login(formData: FormData) {
  const supabase = await getSupabaseServerClient()

  const emailOrUsername = formData.get("email") as string
  const password = formData.get("password") as string

  if (!emailOrUsername || !password) {
    return { error: "Email/username dan password harus diisi" }
  }

  let email = emailOrUsername

  // Check if input is username (not email format)
  if (!emailOrUsername.includes("@")) {
    // Look up email by username
    const { data: profile } = await supabase
      .from("profiles")
      .select("email")
      .eq("username", emailOrUsername)
      .single()

    if (!profile?.email) {
      return { error: "Username tidak ditemukan" }
    }
    email = profile.email
  }

  // Attempt login
  const { data, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (authError || !data.session) {
    return { error: "Email/username atau password salah" }
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("email", email)
    .single()

  if (!profile || (profile.role !== "admin" && profile.role !== "Admin")) {
    // Sign out non-admin users
    await supabase.auth.signOut()
    return { error: "Akses ditolak. Hanya admin yang dapat masuk." }
  }

  const headersList = await headers()
  const host = headersList.get('host') || ''
  const isGfsDomain = host.endsWith('gameforsmart.com')
  const isSecure = process.env.NODE_ENV === 'production' || host.includes('vercel.app')

  // Set gfs-session for cross-domain SSO
  const cookieStore = await cookies()
  
  const cookieOptions: any = {
      path: '/',
      maxAge: 604800,
      secure: isSecure,
      sameSite: 'lax'
  }
  
  // Hanya gunakan domain='.gameforsmart.com' jika benar-benar sedang berjalan di domain tersebut
  // Ini memastikan testing di URL Vercel (.vercel.app) tetap bisa nyimpan cookie dengan sukses
  if (isGfsDomain) {
      cookieOptions.domain = '.gameforsmart.com'
  }

  // PENTING: Format harus pakai pipe (|) bukan JSON, agar sama dengan Astrolearn/NitroQuiz
  const sessionValue = `${data.session.access_token}|${data.session.refresh_token}`
  
  cookieStore.set('gfs-session', sessionValue, cookieOptions)

  revalidatePath("/", "layout")
  redirect("/dashboard")
}

export async function logout() {
  const supabase = await getSupabaseServerClient()
  await supabase.auth.signOut()

  const headersList = await headers()
  const host = headersList.get('host') || ''
  const isGfsDomain = host.endsWith('gameforsmart.com')

  const cookieOptions: any = {
      path: '/',
      maxAge: 0,
  }
  if (isGfsDomain) {
      cookieOptions.domain = '.gameforsmart.com'
  }

  // Remove gfs-session cookie for cross-domain SSO
  const cookieStore = await cookies()
  cookieStore.set('gfs-session', '', cookieOptions)

  revalidatePath("/", "layout")
  redirect("/login")
}
