"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ChipLink } from "@/lib/supabaseAdminClient";

interface UpdateChipModalProps {
  isOpen: boolean;
  onClose: () => void;
  chip: ChipLink;
  onUpdate: (updatedChip: ChipLink) => void;
}

export default function UpdateChipModal({
  isOpen,
  onClose,
  chip,
  onUpdate,
}: UpdateChipModalProps) {
  const [chipId, setChipId] = useState(chip.chip_id);
  const [collectibleId, setCollectibleId] = useState(chip.collectible_id);

  useEffect(() => {
    setChipId(chip.chip_id);
    setCollectibleId(chip.collectible_id);
  }, [chip]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate({ ...chip, chip_id: chipId, collectible_id: collectibleId });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update Chip</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="id" className="text-sm font-medium">
              ID
            </label>
            <Input id="id" value={chip.id.toString()} disabled />
          </div>

          <div>
            <label htmlFor="chipId" className="text-sm font-medium">
              Chip ID
            </label>
            <Input
              id="chipId"
              value={chipId}
              onChange={(e) => setChipId(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="collectibleId" className="text-sm font-medium">
              Collectible ID
            </label>
            <Input
              id="collectibleId"
              value={collectibleId.toString()}
              onChange={(e) => setCollectibleId(parseInt(e.target.value))}
              required
            />
          </div>
          <Button type="submit">Update</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
