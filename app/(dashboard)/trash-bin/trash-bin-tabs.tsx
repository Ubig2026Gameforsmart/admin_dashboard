"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Users, User, Trash2 } from "lucide-react";
import { TrashQuizTable } from "./trash-quiz-table";
import { TrashUserTable } from "./trash-user-table";
import { TrashGroupTable } from "./trash-group-table";
import type { DeletedQuiz, DeletedUser, DeletedGroup } from "@/types/trash-bin";
import { useTranslation } from "@/lib/i18n";

interface TrashBinTabsProps {
  initialQuizzes: DeletedQuiz[];
  initialUsers: DeletedUser[];
  initialGroups: DeletedGroup[];
}

export function TrashBinTabs({
  initialQuizzes,
  initialUsers,
  initialGroups,
}: TrashBinTabsProps) {
  const [activeTab, setActiveTab] = useState("quiz");
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
            <Trash2 className="h-5 w-5 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            {t("page.trash_bin")}
          </h1>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
          <TabsTrigger value="quiz" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            <span>{t("nav.quizzes")}</span>
            <span className="ml-1 text-xs bg-sidebar-accent/50 text-muted-foreground px-1.5 py-0.5 rounded-full">
              {initialQuizzes.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="user" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span>{t("nav.users")}</span>
            <span className="ml-1 text-xs bg-sidebar-accent/50 text-muted-foreground px-1.5 py-0.5 rounded-full">
              {initialUsers.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="group" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span>{t("nav.groups")}</span>
            <span className="ml-1 text-xs bg-sidebar-accent/50 text-muted-foreground px-1.5 py-0.5 rounded-full">
              {initialGroups.length}
            </span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="quiz" className="mt-4">
          <TrashQuizTable initialData={initialQuizzes} />
        </TabsContent>

        <TabsContent value="user" className="mt-4">
          <TrashUserTable initialData={initialUsers} />
        </TabsContent>

        <TabsContent value="group" className="mt-4">
          <TrashGroupTable initialData={initialGroups} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
