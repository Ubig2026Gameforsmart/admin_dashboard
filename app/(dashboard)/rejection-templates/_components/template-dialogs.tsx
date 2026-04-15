import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RejectionTemplate } from "@/types/rejection-template";

interface TemplateDialogProps {
  t: any;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  editingTemplate: RejectionTemplate | null;
  formType: string;
  setFormType: (val: string) => void;
  setEditingTemplate: (val: RejectionTemplate | null) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>, t: any) => void;
  loading: boolean;
}

export function TemplateDialog({
  t,
  isOpen,
  onOpenChange,
  editingTemplate,
  formType,
  setFormType,
  setEditingTemplate,
  onSubmit,
  loading,
}: TemplateDialogProps) {
  return (
    <Dialog 
      open={isOpen} 
      onOpenChange={(open) => {
        onOpenChange(open);
        if (!open) {
          setEditingTemplate(null);
          setFormType("quiz");
        }
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          {t("rejection_templates.add") || "Add Template"}
        </Button>
      </DialogTrigger>
      <DialogContent showCloseButton={false}>
        <form onSubmit={(e) => onSubmit(e, t)}>
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? (t("rejection_templates.edit") || "Edit Template") : (t("rejection_templates.add") || "Add Template")}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="reason_en">{t("rejection_templates.reason_en") || "Reason (English)"}</Label>
              <Input 
                id="reason_en"
                name="reason_en" 
                defaultValue={editingTemplate?.reason_en} 
                placeholder={t("rejection_templates.enter_reason_en") || "Enter reason in English..."} 
                required 
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="reason_id">{t("rejection_templates.reason_id") || "Reason (Indonesian)"}</Label>
              <Input 
                id="reason_id"
                name="reason_id" 
                defaultValue={editingTemplate?.reason_id} 
                placeholder={t("rejection_templates.enter_reason_id") || "Enter reason in Indonesian..."} 
                required 
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>{t("rejection_templates.type") || "Type"}</Label>
                <Select
                  value={formType}
                  onValueChange={(value) => setFormType(value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="quiz">Quiz</SelectItem>
                    <SelectItem value="user">User Report</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {editingTemplate && (
                <div className="grid gap-2">
                  <Label>{t("rejection_templates.status") || "Status"}</Label>
                  <Select
                    value={editingTemplate?.is_active ? "active" : "inactive"}
                    onValueChange={(value) => setEditingTemplate({...editingTemplate, is_active: value === "active"})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">{t("rejection_templates.active") || "Active"}</SelectItem>
                      <SelectItem value="inactive">{t("rejection_templates.inactive") || "Inactive"}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t("action.cancel") || "Cancel"}
            </Button>
            <Button type="submit" disabled={loading}>
              {t("action.save") || "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
