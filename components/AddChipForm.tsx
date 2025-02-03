"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function AddChipForm() {
  const [chipId, setChipId] = useState("")
  const [collectibleId, setCollectibleId] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log("Add", { chipId, collectibleId })
    setChipId("")
    setCollectibleId("")
  }

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
      <Button type="submit" className="min-w-24 font-semibold text-lg h-full">Add</Button>
    </form>
  )
}

