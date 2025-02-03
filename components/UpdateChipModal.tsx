"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface Chip {
  id: number
  chipId: string
  collectibleId: string
  dateTime: string
}

interface UpdateChipModalProps {
  isOpen: boolean
  onClose: () => void
  chip: Chip
  onUpdate: (updatedChip: Chip) => void
}

export default function UpdateChipModal({ isOpen, onClose, chip, onUpdate }: UpdateChipModalProps) {
  const [chipId, setChipId] = useState(chip.chipId)
  const [collectibleId, setCollectibleId] = useState(chip.collectibleId)

  useEffect(() => {
    setChipId(chip.chipId)
    setCollectibleId(chip.collectibleId)
  }, [chip])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onUpdate({ ...chip, chipId, collectibleId })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update Chip</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="chipId" className="text-sm font-medium">
              Chip ID
            </label>
            <Input id="chipId" value={chipId} onChange={(e) => setChipId(e.target.value)} required />
          </div>
          <div>
            <label htmlFor="collectibleId" className="text-sm font-medium">
              Collectible ID
            </label>
            <Input
              id="collectibleId"
              value={collectibleId}
              onChange={(e) => setCollectibleId(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="dateTime" className="text-sm font-medium">
              Date and Time
            </label>
            <Input id="dateTime" value={chip.dateTime} disabled />
          </div>
          <Button type="submit">Update</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}