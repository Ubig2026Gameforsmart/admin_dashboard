"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ConfirmDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: React.ReactNode;
  expectedText?: string;
  onConfirm: () => void;
  isDestructive?: boolean;
}

export function ConfirmDeleteDialog({
  open,
  onOpenChange,
  title,
  description,
  expectedText,
  onConfirm,
  isDestructive = true,
}: ConfirmDeleteDialogProps) {
  const { t } = useTranslation();
  const [inputText, setInputText] = useState("");

  const matchText = expectedText || t("action.delete");

  useEffect(() => {
    if (open) {
      setInputText("");
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle className={isDestructive ? "text-destructive" : ""}>
            {title || t("action.confirm_delete")}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-2 py-4">
          <Label htmlFor="confirmMatch">
            {t("users.type_confirm")} <strong className={isDestructive ? "text-destructive" : ""}>{matchText}</strong> {t("users.to_confirm")}
          </Label>
          <Input
            id="confirmMatch"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={`${t("users.type_confirm")} '${matchText}'`}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("action.cancel")}
          </Button>
          <Button
            variant={isDestructive ? "destructive" : "default"}
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
            disabled={inputText !== matchText}
          >
            {matchText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
