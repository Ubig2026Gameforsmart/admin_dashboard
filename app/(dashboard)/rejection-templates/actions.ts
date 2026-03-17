"use server";

import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import { revalidatePath } from "next/cache";

export async function getTemplates() {
  const supabase = getSupabaseAdminClient();

  const { data, error } = await supabase
    .from("rejection_templates")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching templates:", error);
    return [];
  }

  return data;
}

export async function createTemplate(formData: FormData) {
  const reason_en = formData.get("reason_en") as string;
  const reason_id = formData.get("reason_id") as string;
  const type = (formData.get("type") as string) || "quiz";

  if (!reason_en || !reason_id) {
    return { error: "Both reasons are required" };
  }

  const supabase = getSupabaseAdminClient();

  const { error } = await supabase.from("rejection_templates").insert({
    type,
    reason_en,
    reason_id,
    is_active: true,
  });

  if (error) {
    console.error("Error creating template:", error);
    return { error: error.message };
  }

  revalidatePath("/rejection-templates");
  return { success: true };
}

export async function updateTemplate(formData: FormData) {
  const id = formData.get("id") as string;
  const reason_en = formData.get("reason_en") as string;
  const reason_id = formData.get("reason_id") as string;
  const type = formData.get("type") as string;
  const is_active = formData.get("is_active") === "true";

  if (!id || !reason_en || !reason_id) {
    return { error: "ID and both reasons are required" };
  }

  const supabase = getSupabaseAdminClient();

  const { error } = await supabase
    .from("rejection_templates")
    .update({
      type,
      reason_en,
      reason_id,
      is_active,
    })
    .eq("id", id);

  if (error) {
    console.error("Error updating template:", error);
    return { error: error.message };
  }

  revalidatePath("/rejection-templates");
  return { success: true };
}

export async function deleteTemplate(id: string) {
  if (!id) return { error: "ID is required" };

  const supabase = getSupabaseAdminClient();

  const { error } = await supabase
    .from("rejection_templates")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting template:", error);
    return { error: error.message };
  }

  revalidatePath("/rejection-templates");
  return { success: true };
}

export async function toggleTemplateStatus(id: string, is_active: boolean) {
  if (!id) return { error: "ID is required" };

  const supabase = getSupabaseAdminClient();

  const { error } = await supabase
    .from("rejection_templates")
    .update({ is_active })
    .eq("id", id);

  if (error) {
    console.error("Error toggling template status:", error);
    return { error: error.message };
  }

  revalidatePath("/rejection-templates");
  return { success: true };
}
