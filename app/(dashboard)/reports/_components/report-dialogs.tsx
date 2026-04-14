import { format } from "date-fns";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { type Report } from "@/types/report";
interface ReportDialogsProps {
  confirmDialog: any;
  setConfirmDialog: (val: any) => void;
  handleConfirm: () => void;
  detailDialog: { open: boolean; report: Report | null };
  setDetailDialog: (val: any) => void;
  notesDialog: any;
  setNotesDialog: (val: any) => void;
  handleSaveNotes: () => void;
  deleteDialog: any;
  setDeleteDialog: (val: any) => void;
  handleDeleteReport: () => void;
}

function formatReportType(type: string | null) {
  if (!type) return "Other";
  return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
}

function formatStatus(status: string | null) {
  if (!status) return "Pending";
  return status
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

export function ReportDialogs({
  confirmDialog,
  setConfirmDialog,
  handleConfirm,
  detailDialog,
  setDetailDialog,
  notesDialog,
  setNotesDialog,
  handleSaveNotes,
  deleteDialog,
  setDeleteDialog,
  handleDeleteReport,
}: ReportDialogsProps) {
  return (
    <>
      <Dialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog((prev: any) => ({ ...prev, open }))}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Change Status</DialogTitle>
            <DialogDescription>Are you sure you want to change the status?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialog((prev: any) => ({ ...prev, open: false }))}>
              Cancel
            </Button>
            <Button onClick={handleConfirm}>Change</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={detailDialog.open} onOpenChange={(open) => setDetailDialog((prev: any) => ({ ...prev, open }))}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{detailDialog.report?.title || "Report Details"}</DialogTitle>
          </DialogHeader>
          {detailDialog.report && (
            <div className="space-y-4 py-4">
              <div>
                <Label className="text-muted-foreground">Description</Label>
                <p className="mt-1">{detailDialog.report.description || "—"}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Type</Label>
                  <p className="mt-1">{formatReportType(detailDialog.report.report_type)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <p className="mt-1">{formatStatus(detailDialog.report.status)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Created</Label>
                  <p className="mt-1">
                    {detailDialog.report.created_at
                      ? format(new Date(detailDialog.report.created_at), "dd MMM yyyy HH:mm")
                      : "—"}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Reporter</Label>
                  <p className="mt-1">
                    {detailDialog.report.reporter?.fullname || detailDialog.report.reporter?.username || "—"}
                  </p>
                </div>
              </div>
              {detailDialog.report.admin_notes && (
                <div>
                  <Label className="text-muted-foreground">Admin Notes</Label>
                  <p className="mt-1 text-sm bg-muted p-2 rounded">{detailDialog.report.admin_notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={notesDialog.open} onOpenChange={(open) => setNotesDialog((prev: any) => ({ ...prev, open }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Admin Notes - {notesDialog.reportTitle}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              value={notesDialog.notes}
              onChange={(e) => setNotesDialog((prev: any) => ({ ...prev, notes: e.target.value }))}
              placeholder="Add admin notes..."
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNotesDialog((prev: any) => ({ ...prev, open: false }))}>
              Cancel
            </Button>
            <Button onClick={handleSaveNotes}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog((prev: any) => ({ ...prev, open, confirmText: "" }))}
      >
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle className="text-destructive">Delete Report</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete report <strong>{deleteDialog.reportTitle}</strong>? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2 py-4">
            <Label htmlFor="confirmDelete">
              Type <strong className="text-destructive">Delete Report</strong> to confirm
            </Label>
            <Input
              id="confirmDelete"
              value={deleteDialog.confirmText}
              onChange={(e) => setDeleteDialog((prev: any) => ({ ...prev, confirmText: e.target.value }))}
              placeholder="Type 'Delete Report' here"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialog((prev: any) => ({ ...prev, open: false, confirmText: "" }))}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteReport}
              disabled={deleteDialog.confirmText !== "Delete Report"}
            >
              Delete Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
