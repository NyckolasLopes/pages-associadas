import * as React from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface ConfirmDialogProps {
  isOpen?: boolean;
  open?: boolean;
  onClose?: () => void;
  onOpenChange?: (open: boolean) => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
}

export function ConfirmDialog({
  isOpen,
  open,
  onClose,
  onOpenChange,
  onConfirm,
  title,
  description,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
}: ConfirmDialogProps) {
  const isActualOpen = open !== undefined ? open : !!isOpen;
  const handleOpenChange = (newOpen: boolean) => {
    if (onOpenChange) onOpenChange(newOpen);
    if (!newOpen && onClose) onClose();
  };

  return (
    <AlertDialog open={isActualOpen} onOpenChange={handleOpenChange}>
      <AlertDialogContent className="border-0 shadow-2xl rounded-2xl max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-xl font-bold text-slate-800">
            {title}
          </AlertDialogTitle>
          {description && (
            <AlertDialogDescription className="text-slate-500 text-sm">
              {description}
            </AlertDialogDescription>
          )}
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-4 gap-2">
          <AlertDialogCancel onClick={onClose} className="border-slate-200 text-slate-600 hover:bg-slate-50">
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={async (e) => {
              e.preventDefault();
              if (onConfirm) await onConfirm();
              if (onClose) onClose();
              if (onOpenChange) onOpenChange(false);
            }}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium shadow-sm px-6"
          >
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
