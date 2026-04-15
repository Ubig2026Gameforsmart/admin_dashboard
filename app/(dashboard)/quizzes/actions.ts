"use server";

import { revalidatePath } from "next/cache";
import { QuizService } from "@/lib/services/quiz-service";
import { FetchQuizzesParams } from "@/types/quiz";

export type { Quiz, QuizzesResponse, QuizSession } from "@/types/quiz";

export async function fetchQuizzes(params: FetchQuizzesParams) {
  return QuizService.fetchQuizzes(params);
}

export async function fetchQuizById(id: string) {
  return QuizService.fetchQuizById(id);
}

export async function getAllQuizzes() {
  return QuizService.getAllQuizzes();
}

export async function fetchQuizSessions(quizId: string) {
  return QuizService.fetchQuizSessions(quizId);
}

export async function updateQuizVisibility(id: string, isPublic: boolean, note?: string) {
  const result = await QuizService.updateQuizVisibility(id, isPublic, note);
  if (!result.error) {
    revalidatePath("/quizzes");
  }
  return result;
}

export async function blockQuizAction(id: string, note?: string) {
  const result = await QuizService.blockQuiz(id, note);
  if (!result.error) {
    revalidatePath("/quizzes");
  }
  return result;
}

export async function unblockQuizAction(id: string, note?: string) {
  const result = await QuizService.unblockQuiz(id, note);
  if (!result.error) {
    revalidatePath("/quizzes");
  }
  return result;
}

export async function deleteQuizAction(id: string) {
  const result = await QuizService.deleteQuiz(id);
  if (!result.error) {
    revalidatePath("/quizzes");
    revalidatePath("/trash-bin");
  }
  return result;
}
