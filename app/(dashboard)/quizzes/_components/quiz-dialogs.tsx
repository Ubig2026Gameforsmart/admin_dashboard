"use client";

import { useTranslation } from "@/lib/i18n";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface QuizDialogsProps {
  confirmDialog: {
    open: boolean;
    id: string;
    currentValue: string;
    newValue: string;
    quizTitle: string;
    note: string;
  };
  setConfirmDialog: React.Dispatch<React.SetStateAction<{
    open: boolean;
    id: string;
    currentValue: string;
    newValue: string;
    quizTitle: string;
    note: string;
  }>>;
  handleConfirm: () => void;

  blockDialog: {
    open: boolean;
    id: string;
    quizTitle: string;
    note: string;
  };
  setBlockDialog: React.Dispatch<React.SetStateAction<{
    open: boolean;
    id: string;
    quizTitle: string;
    note: string;
  }>>;
  handleBlockQuiz: () => void;

  unblockDialog: {
    open: boolean;
    id: string;
    quizTitle: string;
    note: string;
  };
  setUnblockDialog: React.Dispatch<React.SetStateAction<{
    open: boolean;
    id: string;
    quizTitle: string;
    note: string;
  }>>;
  handleUnblock: () => void;
}

export function QuizDialogs({
  confirmDialog,
  setConfirmDialog,
  handleConfirm,
  blockDialog,
  setBlockDialog,
  handleBlockQuiz,
  unblockDialog,
  setUnblockDialog,
  handleUnblock,
}: QuizDialogsProps) {
  const { t } = useTranslation();

  return (
    <>
      <Dialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog((prev) => ({ ...prev, open }))}
      >
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>{t("quiz.change_visibility")}</DialogTitle>
            <DialogDescription>
              {t("quiz.change_visibility_desc")}{" "}
              <strong>{confirmDialog.quizTitle}</strong> {t("users.from")}{" "}
              <strong>
                {confirmDialog.currentValue === "Public"
                  ? t("status.public")
                  : t("status.private")}
              </strong>{" "}
              {t("users.to")}{" "}
              <strong>
                {confirmDialog.newValue === "Public"
                  ? t("status.public")
                  : t("status.private")}
              </strong>
              ?
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2 py-4">
            <Label htmlFor="note">Reason</Label>
            <Textarea
              id="note"
              value={confirmDialog.note}
              onChange={(e) =>
                setConfirmDialog((prev) => ({ ...prev, note: e.target.value }))
              }
              placeholder="Reason for changing visibility..."
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setConfirmDialog((prev) => ({ ...prev, open: false }))
              }
            >
              {t("action.cancel")}
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={!confirmDialog.note.trim()}
            >
              Change
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={blockDialog.open}
        onOpenChange={(open) =>
          setBlockDialog((prev) => ({ ...prev, open, note: "" }))
        }
      >
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle className="text-destructive">
              {t("quiz.block_title")}
            </DialogTitle>
            <DialogDescription>
              {t("quiz.block_desc")} <strong>{blockDialog.quizTitle}</strong>.{" "}
              {t("quiz.block_desc2")}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2 py-4">
            <Label htmlFor="blockReason">Reason</Label>
            <Textarea
              id="blockReason"
              value={blockDialog.note}
              onChange={(e) =>
                setBlockDialog((prev) => ({
                  ...prev,
                  note: e.target.value,
                }))
              }
              placeholder="Reason for blocking..."
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setBlockDialog((prev) => ({
                  ...prev,
                  open: false,
                  note: "", 
                }))
              }
            >
              {t("action.cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleBlockQuiz}
              disabled={!blockDialog.note.trim()}
            >
              {t("quiz.block_btn")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={unblockDialog.open}
        onOpenChange={(open) => setUnblockDialog((prev) => ({ ...prev, open }))}
      >
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>{t("quiz.unblock_title")}</DialogTitle>
            <DialogDescription>
              {t("quiz.unblock_desc")}{" "}
              <strong>{unblockDialog.quizTitle}</strong>?
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2 py-4">
            <Label htmlFor="unblockReason">Reason</Label>
            <Textarea
              id="unblockReason"
              value={unblockDialog.note}
              onChange={(e) =>
                setUnblockDialog((prev) => ({ ...prev, note: e.target.value }))
              }
              placeholder="Reason for unblocking..."
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setUnblockDialog((prev) => ({ ...prev, open: false }))
              }
            >
              {t("action.cancel")}
            </Button>
            <Button
              onClick={handleUnblock}
              disabled={!unblockDialog.note.trim()}
            >
              {t("quiz.unblock_btn")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
