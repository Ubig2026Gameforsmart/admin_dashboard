"use server";

import { revalidatePath } from "next/cache";
import { CategoryService } from "@/lib/services/category-service";

export async function saveCategoryAction(id: string | null, payload: { name: string; status: string }) {
  let result;
  if (id) {
    result = await CategoryService.updateCategory(id, payload);
  } else {
    result = await CategoryService.createCategory(payload);
  }

  if (!result.error) {
    revalidatePath("/category");
  }
  return result;
}

export async function toggleCategoryStatusAction(id: string, currentStatus: string) {
  const result = await CategoryService.toggleStatus(id, currentStatus);
  if (!result.error) {
    revalidatePath("/category");
  }
  return result;
}
