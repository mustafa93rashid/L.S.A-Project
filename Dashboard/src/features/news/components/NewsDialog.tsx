import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import NewsForm from "./NewsForm";

import type { News } from "../types";

type NewsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  news?: News | null;
};

// ==================== News Dialog ====================

export default function NewsDialog({
  open,
  onOpenChange,
  news = null,
}: NewsDialogProps) {
  const isEditing = Boolean(news);

  // ==================== Close ====================

  const handleClose = () => {
    onOpenChange(false);
  };

  // ==================== Render ====================

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {isEditing
              ? "Edit News"
              : "Create News"}
          </DialogTitle>

          <DialogDescription>
            {isEditing
              ? "Update the selected news item and save your changes."
              : "Create a new news item to display on the website."}
          </DialogDescription>
        </DialogHeader>

        <NewsForm
          news={news}
          onSuccess={handleClose}
          onCancel={handleClose}
        />
      </DialogContent>
    </Dialog>
  );
}