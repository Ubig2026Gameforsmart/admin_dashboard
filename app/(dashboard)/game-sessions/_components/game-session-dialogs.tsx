import Link from "next/link";
import { Filter, RotateCcw } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { type GameSession } from "@/types/game-session";

interface GameSessionDialogsProps {
  t: any;
  isFilterOpen: boolean;
  setIsFilterOpen: (open: boolean) => void;
  tempFilters: any;
  setTempFilters: (filters: any) => void;
  selectedParticipants: GameSession["participants"] | null;
  setSelectedParticipants: (participants: GameSession["participants"] | null) => void;
  handleResetFilter: () => void;
  handleApplyFilter: () => void;
}

export function GameSessionDialogs({
  t,
  isFilterOpen,
  setIsFilterOpen,
  tempFilters,
  setTempFilters,
  selectedParticipants,
  setSelectedParticipants,
  handleResetFilter,
  handleApplyFilter,
}: GameSessionDialogsProps) {
  return (
    <>
      <Dialog open={isFilterOpen} onOpenChange={setIsFilterOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-primary" />
              {t("game_sessions.filter_title")}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>{t("game_sessions.status")}</Label>
              <Select
                value={tempFilters.status}
                onValueChange={(value) =>
                  setTempFilters((prev: any) => ({ ...prev, status: value }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t("game_sessions.select_status")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("filter.all_status")}</SelectItem>
                  <SelectItem value="finished">
                    {t("game_sessions.status_finished")}
                  </SelectItem>
                  <SelectItem value="active">
                    {t("game_sessions.status_active")}
                  </SelectItem>
                  <SelectItem value="waiting">
                    {t("game_sessions.status_waiting")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>{t("table.category")}</Label>
              <Select
                value={tempFilters.category}
                onValueChange={(value) =>
                  setTempFilters((prev: any) => ({ ...prev, category: value }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t("game_sessions.select_category")} />
                </SelectTrigger>
                <SelectContent className="max-h-[200px]">
                  <SelectItem value="all">
                    {t("filter.all_categories")}
                  </SelectItem>
                  {[
                    "math",
                    "science",
                    "history",
                    "geography",
                    "technology",
                    "language",
                    "art",
                    "music",
                    "sports",
                    "general",
                    "business",
                  ].map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {t(`category.${cat}`) ||
                        cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>{t("game_sessions.application")}</Label>
              <Select
                value={tempFilters.application}
                onValueChange={(value) =>
                  setTempFilters((prev: any) => ({
                    ...prev,
                    application: value,
                  }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t("game_sessions.select_application")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {t("game_sessions.all_applications")}
                  </SelectItem>
                  <SelectItem value="Gameforsmart">Gameforsmart</SelectItem>
                  <SelectItem value="Space-Quiz">Space-Quiz</SelectItem>
                  <SelectItem value="Memoryquiz">Memoryquiz</SelectItem>
                  <SelectItem value="Crazyrace">Crazyrace</SelectItem>
                  <SelectItem value="Quizrush">Quizrush</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>{t("game_sessions.questions")}</Label>
              <Select
                value={tempFilters.questions}
                onValueChange={(value) =>
                  setTempFilters((prev: any) => ({ ...prev, questions: value }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t("game_sessions.select_questions")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {t("game_sessions.all_questions")}
                  </SelectItem>
                  <SelectItem value="5">
                    {t("game_sessions.questions_count").replace("{{count}}", "5")}
                  </SelectItem>
                  <SelectItem value="10">
                    {t("game_sessions.questions_count").replace("{{count}}", "10")}
                  </SelectItem>
                  <SelectItem value="20">
                    {t("game_sessions.questions_count").replace("{{count}}", "20")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>{t("game_dashboard.avg_duration")}</Label>
              <Select
                value={tempFilters.duration}
                onValueChange={(value) =>
                  setTempFilters((prev: any) => ({ ...prev, duration: value }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t("game_sessions.select_duration")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {t("game_sessions.all_durations")}
                  </SelectItem>
                  <SelectItem value="5">
                    {t("game_sessions.minutes_count").replace("{{count}}", "5")}
                  </SelectItem>
                  <SelectItem value="10">
                    {t("game_sessions.minutes_count").replace("{{count}}", "10")}
                  </SelectItem>
                  <SelectItem value="15">
                    {t("game_sessions.minutes_count").replace("{{count}}", "15")}
                  </SelectItem>
                  <SelectItem value="20">
                    {t("game_sessions.minutes_count").replace("{{count}}", "20")}
                  </SelectItem>
                  <SelectItem value="25">
                    {t("game_sessions.minutes_count").replace("{{count}}", "25")}
                  </SelectItem>
                  <SelectItem value="30">
                    {t("game_sessions.minutes_count").replace("{{count}}", "30")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="flex-row gap-2 sm:justify-between">
            <Button
              variant="ghost"
              onClick={handleResetFilter}
              className="gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              {t("action.reset")}
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setIsFilterOpen(false)}
              >
                {t("action.cancel")}
              </Button>
              <Button
                onClick={handleApplyFilter}
                className="bg-primary hover:bg-primary/90"
              >
                {t("action.apply_filter")}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!selectedParticipants}
        onOpenChange={(open) => !open && setSelectedParticipants(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("game_sessions.players")}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[300px] w-full pr-4">
            <div className="space-y-4">
              {selectedParticipants?.map((p, index) => {
                const content = (
                  <>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage
                          src={
                            p.avatar_url ||
                            `https://api.dicebear.com/9.x/avataaars/svg?seed=${
                              p.nickname || "user"
                            }`
                          }
                        />
                        <AvatarFallback>
                          {(p.nickname || "U").charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium text-sm group-hover:text-primary transition-colors">
                        {p.nickname || "Unknown Player"}
                      </span>
                    </div>
                    <div className="text-sm font-semibold text-primary">
                      {p.score || 0} pts
                    </div>
                  </>
                );

                if (p.user_id) {
                  return (
                    <Link
                      key={index}
                      href={`/users/${p.user_id}`}
                      className="group flex items-center justify-between p-2 rounded-lg border bg-card/50 hover:bg-primary/10 hover:border-primary transition-all cursor-pointer"
                      target="_blank"
                    >
                      {content}
                    </Link>
                  );
                }

                return (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 rounded-lg border bg-card/50"
                  >
                    {content}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}
