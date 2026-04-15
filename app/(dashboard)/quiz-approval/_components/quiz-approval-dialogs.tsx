"use client";

import { useTranslation } from "@/lib/i18n";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmActionDialog } from "@/components/shared/confirm-action-dialog";
import { DialogState } from "../_hooks/use-quiz-approval-table";

interface QuizApprovalDialogsProps {
  approveDialog: DialogState;
  setApproveDialog: React.Dispatch<React.SetStateAction<DialogState>>;
  executeApprove: () => void;
  rejectDialog: DialogState;
  setRejectDialog: React.Dispatch<React.SetStateAction<DialogState>>;
  executeReject: () => void;
  rejectionTemplates: any[];
  selectedReasons: string[];
  setSelectedReasons: React.Dispatch<React.SetStateAction<string[]>>;
  rejectionNote: string;
  setRejectionNote: React.Dispatch<React.SetStateAction<string>>;
}

export function QuizApprovalDialogs({
  approveDialog,
  setApproveDialog,
  executeApprove,
  rejectDialog,
  setRejectDialog,
  executeReject,
  rejectionTemplates,
  selectedReasons,
  setSelectedReasons,
  rejectionNote,
  setRejectionNote,
}: QuizApprovalDialogsProps) {
  const { t } = useTranslation();

  return (
    <>
      {/* Approve Dialog */}
      <ConfirmActionDialog
        open={approveDialog.open}
        onOpenChange={(open) => setApproveDialog((prev) => ({ ...prev, open }))}
        title={t("approval.approve_title")}
        description={
          <>
            {t("approval.approve_desc")} <strong>{approveDialog.title}</strong>?
          </>
        }
        onConfirm={executeApprove}
        confirmText={t("action.approve")}
      />

      {/* Reject Dialog */}
      <Dialog
        open={rejectDialog.open}
        onOpenChange={(open) => setRejectDialog((prev) => ({ ...prev, open }))}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{t("rejection.title") || "Reject Quiz?"}</DialogTitle>
            <DialogDescription>
              {t("rejection.subtitle") ||
                "Select 1-3 reasons for rejection to inform the creator."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="flex justify-between items-center text-sm font-medium">
              <Label>{t("rejection.title") || "Reason"}</Label>
              <span className="text-muted-foreground">{selectedReasons.length}/3</span>
            </div>
            <div className="flex flex-col gap-1 max-h-[280px] overflow-y-auto pr-1">
              {rejectionTemplates.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">
                  No templates available. Add them in Rejection Templates.
                </p>
              ) : (
                rejectionTemplates.map((template) => {
                  const labelStr =
                    t("rejection_templates.reason_en") === "Reason (English)"
                      ? template.reason_en
                      : template.reason_id;

                  return (
                    <div
                      key={template.id}
                      className="flex items-start gap-3 rounded-lg border border-border/50 px-3 py-3 hover:bg-secondary/40 transition-colors"
                    >
                      <Checkbox
                        id={`reason-${template.id}`}
                        checked={selectedReasons.includes(labelStr)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            if (selectedReasons.length < 3) {
                              setSelectedReasons([...selectedReasons, labelStr]);
                            }
                          } else {
                            setSelectedReasons(
                              selectedReasons.filter((r) => r !== labelStr)
                            );
                          }
                        }}
                        disabled={
                          !selectedReasons.includes(labelStr) &&
                          selectedReasons.length >= 3
                        }
                        className="mt-0.5"
                      />
                      <label
                        htmlFor={`reason-${template.id}`}
                        className="text-sm leading-relaxed peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {labelStr}
                      </label>
                    </div>
                  );
                })
              )}
            </div>
            <Textarea
              placeholder={
                t("rejection.additional_note") || "Additional note (optional)..."
              }
              value={rejectionNote}
              onChange={(e) => setRejectionNote(e.target.value)}
              className="h-20 resize-none mt-2"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRejectDialog((prev) => ({ ...prev, open: false }))}
            >
              {t("rejection.cancel") || "Cancel"}
            </Button>
            <Button
              variant="destructive"
              onClick={executeReject}
              disabled={selectedReasons.length === 0 && !rejectionNote.trim()}
            >
              {t("rejection.reject") || "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
