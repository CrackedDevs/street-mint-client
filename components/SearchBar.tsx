'use client'

import { useState } from 'react'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search } from 'lucide-react'

interface SearchBarProps {
  onSearch: (query: string) => void
}

export default function SearchBar({ onSearch }: SearchBarProps) {
  const [query, setQuery] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSearch(query)
  }

  return (
    <form onSubmit={handleSubmit} className="flex space-x-4 h-11">
      <Input
        type="text"
        placeholder="Search chips . . ."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="flex-grow max-w-[370px] px-5 text-base h-full"
      />
      <Button type="submit" className="text-base h-full">
        Search 
        <Search className="w-5 h-5 ml-2" />
      </Button>
    </form>
  )
}
