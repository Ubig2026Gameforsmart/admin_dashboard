import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { CompetitionListItem } from "@/types/competition";

interface CompetitionDialogsProps {
  t: any;
  previewPoster: { url: string; title: string } | null;
  setPreviewPoster: (val: { url: string; title: string } | null) => void;
  deleteTarget: CompetitionListItem | null;
  setDeleteTarget: (val: CompetitionListItem | null) => void;
  deleteConfirmationPhrase: string;
  setDeleteConfirmationPhrase: (val: string) => void;
  isDeleting: boolean;
  handleDeleteCompetition: () => void;
}

export function CompetitionDialogs({
  t,
  previewPoster,
  setPreviewPoster,
  deleteTarget,
  setDeleteTarget,
  deleteConfirmationPhrase,
  setDeleteConfirmationPhrase,
  isDeleting,
  handleDeleteCompetition,
}: CompetitionDialogsProps) {
  return (
    <>
      <Dialog open={!!previewPoster} onOpenChange={() => setPreviewPoster(null)}>
        <DialogContent className="max-w-lg p-2 flex flex-col gap-2 border shadow-lg bg-card text-card-foreground">
          <DialogTitle className="sr-only">Poster Preview</DialogTitle>
          {previewPoster && (
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium px-2 pt-2">{previewPoster.title}</p>
              <img
                src={previewPoster.url}
                alt={previewPoster.title}
                className="w-full rounded-md object-contain max-h-[70vh] bg-muted/20"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-[425px]">
          {!deleteTarget ? null : (
            <>
              <DialogHeader>
                <DialogTitle className="text-destructive">
                  {t("manage_competitions.delete_confirm_title") || "Delete Competition"}
                </DialogTitle>
              </DialogHeader>
              <div className="py-4">
                <div className="text-sm text-muted-foreground mb-4">
                  {(() => {
                    const desc =
                      t("manage_competitions.delete_confirm_desc") ||
                      "This action cannot be undone. Are you sure you want to delete {{name}}?";
                    if (desc.includes("{{name}}")) {
                      const parts = desc.split("{{name}}");
                      return (
                        <p title={deleteTarget.title}>
                          {parts[0]}
                          <span className="font-bold text-primary">
                            {deleteTarget.title.length > 40
                              ? deleteTarget.title.substring(0, 40) + "..."
                              : deleteTarget.title}
                          </span>
                          {parts[1]}
                        </p>
                      );
                    }
                    return desc;
                  })()}
                </div>
                <Label className="text-sm font-medium mb-2 block">
                  {(() => {
                    const instr =
                      t("manage_competitions.delete_confirm_instruction") ||
                      "Please type Delete Competition to confirm.";
                    const phrase = t("manage_competitions.delete_phrase") || "Delete Competition";
                    if (instr.includes(phrase)) {
                      const parts = instr.split(phrase);
                      return (
                        <>
                          {parts[0]}
                          <span className="font-bold select-none text-destructive">
                            "{phrase}"
                          </span>
                          {parts[1]}
                        </>
                      );
                    }
                    return instr;
                  })()}
                </Label>
                <Input
                  value={deleteConfirmationPhrase}
                  onChange={(e) => setDeleteConfirmationPhrase(e.target.value)}
                  placeholder={t("manage_competitions.delete_phrase") || "Type 'Delete Competition'"}
                  autoComplete="off"
                />
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setDeleteTarget(null)}
                  disabled={isDeleting}
                >
                  {t("action.cancel") || "Cancel"}
                </Button>
                <Button
                  variant="destructive"
                  disabled={
                    deleteConfirmationPhrase !==
                      (t("manage_competitions.delete_phrase") || "Delete Competition") || isDeleting
                  }
                  onClick={handleDeleteCompetition}
                >
                  {isDeleting ? "Deleting..." : t("action.delete") || "Delete"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
