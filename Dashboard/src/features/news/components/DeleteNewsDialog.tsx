import {
  AlertTriangle,
  Loader2,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";

import type { News } from "../types";

type DeleteNewsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  news?: News | null;
  isDeleting?: boolean;
  onConfirm: () => void;
};

export default function DeleteNewsDialog({
  open,
  onOpenChange,
  news,
  isDeleting = false,
  onConfirm,
}: DeleteNewsDialogProps) {
  const handleOpenChange = (nextOpen: boolean) => {
    if (isDeleting) {
      return;
    }

    onOpenChange(nextOpen);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}
    >
      <DialogContent
        className="sm:max-w-md"
        onInteractOutside={(event) => {
          if (isDeleting) {
            event.preventDefault();
          }
        }}
        onEscapeKeyDown={(event) => {
          if (isDeleting) {
            event.preventDefault();
          }
        }}
      >
        <DialogHeader>
          <div className="mb-2 flex size-11 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="size-5 text-destructive" />
          </div>

          <DialogTitle>
            Delete News
          </DialogTitle>

          <DialogDescription>
            Are you sure you want to delete{" "}
            <span className="font-medium text-foreground">
              {news?.title || "this news item"}
            </span>
            ? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            disabled={isDeleting}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>

          <Button
            type="button"
            variant="destructive"
            disabled={isDeleting || !news}
            onClick={() => {
              if (!news || isDeleting) {
                return;
              }

              onConfirm();
            }}
          >
            {isDeleting && (
              <Loader2 className="mr-2 size-4 animate-spin" />
            )}

            {isDeleting
              ? "Deleting..."
              : "Delete News"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}