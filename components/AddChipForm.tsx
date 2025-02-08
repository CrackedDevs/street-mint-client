"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChipLinkCreate } from "@/lib/supabaseAdminClient";
import { Loader2 } from "lucide-react";

export default function AddChipForm({
  onAddChipLink,
}: {
  onAddChipLink: (chipLink: ChipLinkCreate) => Promise<void>;
}) {
  const [chipId, setChipId] = useState("");
  const [collectibleId, setCollectibleId] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Add", { chipId, collectibleId });
    setIsLoading(true);
    await onAddChipLink({
      chip_id: chipId,
      collectible_id: parseInt(collectibleId),
      active: true,
    });
    setChipId("");
    setCollectibleId("");
    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="flex space-x-4 w-full h-11">
      <Input
        type="text"
        placeholder="Chip ID"
        value={chipId}
        onChange={(e) => setChipId(e.target.value)}
        className="px-5 text-base font-semibold h-full"
        required
      />
      <Input
        type="text"
        placeholder="Collectible ID"
        value={collectibleId}
        onChange={(e) => setCollectibleId(e.target.value)}
        className="px-5 text-base font-semibold h-full"
        required
      />
      <Button type="submit" className="min-w-24 font-semibold text-lg h-full">
        {isLoading ? <Loader2 className="animate-spin" /> : "Add"}
      </Button>
    </form>
  );
}
