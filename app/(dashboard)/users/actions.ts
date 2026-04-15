"use server"

import { revalidatePath } from "next/cache"
import { UserService } from "@/lib/services/user-service"
import type { FetchProfilesParams } from "@/types/user"

// Re-export types so we don't break existing imports across the app
export type {
  Profile,
  UserQuiz,
  CreatedQuiz,
  UserGameActivity,
  ProfilesResponse
} from "@/types/user"

export async function fetchProfileById(id: string) {
  return UserService.fetchProfileById(id)
}

export async function fetchUserQuizzes(userId: string) {
  return UserService.fetchUserQuizzes(userId)
}

export async function fetchCreatedQuizzes(userId: string) {
  return UserService.fetchCreatedQuizzes(userId)
}

export async function fetchUserGameActivity(userId: string) {
  return UserService.fetchUserGameActivity(userId)
}

export async function fetchProfiles(params: FetchProfilesParams) {
  return UserService.fetchProfiles(params)
}

export async function updateProfileAction(id: string, updates: any) {
  const result = await UserService.updateProfile(id, updates)
  
  if (!result.error) {
    revalidatePath("/users")
  }
  
  return result
}

export async function deleteProfileAction(id: string) {
  const result = await UserService.deleteProfile(id)
  
  if (!result.error) {
    revalidatePath("/users")
    revalidatePath("/trash-bin")
  }
  
  return result
}

export async function getAllProfiles() {
  return UserService.getAllProfiles()
}

