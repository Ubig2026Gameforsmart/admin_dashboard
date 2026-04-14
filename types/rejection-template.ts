export interface RejectionTemplate {
  id: string;
  type: string; // 'quiz' | 'user' etc.
  reason_en: string;
  reason_id: string;
  is_active: boolean;
  created_at: string;
}

export type CreateRejectionTemplateInput = Omit<RejectionTemplate, "id" | "created_at">;

export type UpdateRejectionTemplateInput = Partial<CreateRejectionTemplateInput> & {
  id: string;
};
