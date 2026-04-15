"use server";

import { revalidatePath } from "next/cache";
import { RejectionTemplateService } from "@/lib/services/rejection-template-service";

export async function getTemplates() {
  try {
    return await RejectionTemplateService.getTemplates();
  } catch (error: any) {
    console.error("Error fetching templates:", error);
    return [];
  }
}

export async function createTemplate(formData: FormData) {
  const reason_en = formData.get("reason_en") as string;
  const reason_id = formData.get("reason_id") as string;
  const type = (formData.get("type") as string) || "quiz";

  if (!reason_en || !reason_id) {
    return { error: "Both reasons are required" };
  }

  try {
    await RejectionTemplateService.createTemplate({
      type,
      reason_en,
      reason_id,
      is_active: true,
    });
    
    revalidatePath("/rejection-templates");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
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

  try {
    await RejectionTemplateService.updateTemplate({
      id,
      type,
      reason_en,
      reason_id,
      is_active,
    });
    
    revalidatePath("/rejection-templates");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function deleteTemplate(id: string) {
  if (!id) return { error: "ID is required" };

  try {
    await RejectionTemplateService.deleteTemplate(id);
    
    revalidatePath("/rejection-templates");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function toggleTemplateStatus(id: string, is_active: boolean) {
  if (!id) return { error: "ID is required" };

  try {
    await RejectionTemplateService.toggleTemplateStatus(id, is_active);
    
    revalidatePath("/rejection-templates");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}
