"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChipLinkDetailed } from "@/lib/supabaseAdminClient";
import { Loader2, X } from "lucide-react";
import { createPortal } from "react-dom";

interface EditChipModalProps {
  isOpen: boolean;
  onClose: () => void;
  chip: ChipLinkDetailed | null;
  onUpdate: (chipId: number, updatedData: { chip_id: string; label: string | null }) => Promise<void>;
  isLoading?: boolean;
}

export default function EditChipModal({
  isOpen,
  onClose,
  chip,
  onUpdate,
  isLoading = false,
}: EditChipModalProps) {
  const [chipId, setChipId] = useState("");
  const [label, setLabel] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when chip changes or modal opens
  useEffect(() => {
    if (chip && isOpen) {
      setChipId(chip.chip_id);
      setLabel(chip.label || "");
    }
  }, [chip, isOpen]);

  // Reset form state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setIsSubmitting(false);
      setChipId("");
      setLabel("");
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!chip || !chipId.trim()) return;

    setIsSubmitting(true);
    try {
      await onUpdate(chip.id, {
        chip_id: chipId.trim(),
        label: label.trim() || null,
      });
      // Add a small delay to ensure the update completes before closing
      setTimeout(() => {
        onClose();
      }, 100);
    } catch (error) {
      console.error("Error updating chip:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!isSubmitting && !isLoading) {
      onClose();
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  const handleEscapeKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleClose();
    }
  };

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleEscapeKey);
      document.body.style.overflow = 'hidden';
    } else {
      document.removeEventListener('keydown', handleEscapeKey);
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Don't render the modal at all when closed
  if (!isOpen) {
    return null;
  }

  const modalContent = (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={handleBackdropClick}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" />
      
      {/* Modal Content */}
      <div className="relative bg-white rounded-lg shadow-lg w-full max-w-md mx-4 p-6 animate-in fade-in-0 zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold">Edit Chip</h2>
            <p className="text-sm text-gray-600 mt-1">
              Update the chip ID and label. Changes will be saved immediately.
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClose}
            disabled={isSubmitting || isLoading}
            className="h-6 w-6 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-chip-id">Chip ID</Label>
            <Input
              id="edit-chip-id"
              type="text"
              value={chipId}
              onChange={(e) => setChipId(e.target.value)}
              placeholder="Enter chip ID"
              disabled={isSubmitting || isLoading}
              required
              autoFocus
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="edit-label">Label</Label>
            <Input
              id="edit-label"
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Enter label (optional)"
              disabled={isSubmitting || isLoading}
            />
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting || isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || isLoading || !chipId.trim()}
            >
              {isSubmitting || isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Chip"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );

  // Use portal to render at document body level
  return typeof window !== 'undefined' ? createPortal(modalContent, document.body) : null;
} 