import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import {
  RejectionTemplate,
  CreateRejectionTemplateInput,
  UpdateRejectionTemplateInput,
} from "@/types/rejection-template";

export class RejectionTemplateService {
  /**
   * Fetch all rejection templates ordered by creation date (descending)
   */
  static async getTemplates(): Promise<RejectionTemplate[]> {
    const supabase = getSupabaseAdminClient();

    const { data, error } = await supabase
      .from("rejection_templates")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching templates:", error);
      throw new Error(error.message);
    }

    return data || [];
  }

  /**
   * Create a new rejection template
   */
  static async createTemplate(
    input: CreateRejectionTemplateInput
  ): Promise<RejectionTemplate> {
    const supabase = getSupabaseAdminClient();

    const { data, error } = await supabase
      .from("rejection_templates")
      .insert({
        type: input.type || "quiz",
        reason_en: input.reason_en,
        reason_id: input.reason_id,
        is_active: input.is_active ?? true,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating template:", error);
      throw new Error(error.message);
    }

    return data;
  }

  /**
   * Update an existing rejection template
   */
  static async updateTemplate(
    input: UpdateRejectionTemplateInput
  ): Promise<RejectionTemplate> {
    const supabase = getSupabaseAdminClient();

    const { data, error } = await supabase
      .from("rejection_templates")
      .update({
        type: input.type,
        reason_en: input.reason_en,
        reason_id: input.reason_id,
        is_active: input.is_active,
      })
      .eq("id", input.id)
      .select()
      .single();

    if (error) {
      console.error("Error updating template:", error);
      throw new Error(error.message);
    }

    return data;
  }

  /**
   * Delete a rejection template
   */
  static async deleteTemplate(id: string): Promise<boolean> {
    const supabase = getSupabaseAdminClient();

    const { error } = await supabase
      .from("rejection_templates")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting template:", error);
      throw new Error(error.message);
    }

    return true;
  }

  /**
   * Toggle the active status of a rejection template
   */
  static async toggleTemplateStatus(
    id: string,
    is_active: boolean
  ): Promise<RejectionTemplate> {
    const supabase = getSupabaseAdminClient();

    const { data, error } = await supabase
      .from("rejection_templates")
      .update({ is_active })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error toggling template status:", error);
      throw new Error(error.message);
    }

    return data;
  }
}
