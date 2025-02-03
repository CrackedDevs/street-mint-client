"use client";

import { useState } from "react";
import { PopulatedCollection } from "@/lib/supabaseClient";
import CollectionCard from "@/components/collectionCard";
import { loginAdmin } from "./actions";
import { Button } from "@/components/ui/button";
import AddChipForm from "@/components/AddChipForm";
import ChipTable from "@/components/ChipTable";

enum Section {
  Library = "library",
  ChipManager = "chip-manager",
}

export default function AdminDashboard() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [password, setPassword] = useState("XxmYMe4dWTjF");
  const [collections, setCollections] = useState<PopulatedCollection[]>([]);
  const [selectedSection, setSelectedSection] = useState<Section>(
    Section.Library
  );

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const result = await loginAdmin(password);
    if (result.success) {
      setIsLoggedIn(true);
      setCollections(result.collections);
    } else {
      alert("Incorrect password");
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <form
          onSubmit={handleLogin}
          className="p-8 bg-white shadow-md rounded-lg"
        >
          <h1 className="text-2xl font-bold mb-4">Admin Login</h1>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            className="w-full p-2 mb-4 border rounded"
          />
          <button
            type="submit"
            className="w-full p-2 bg-blue-500 text-white rounded"
          >
            Login
          </button>
        </form>
      </div>
    );
  }

  return (
    <div>
      <nav className="bg-gray-800 p-4">
        <div className="container mx-auto flex justify-between items-center">
          <div className="text-white font-bold text-xl">
            StreetMint Admin Panel
          </div>
          <div className="space-x-4">
            <Button
              onClick={() => setSelectedSection(Section.Library)}
              className="text-white hover:text-gray-300"
            >
              Library
            </Button>
            <Button
              onClick={() => setSelectedSection(Section.ChipManager)}
              className="text-white hover:text-gray-300"
            >
              Chips Manager
            </Button>
          </div>
        </div>
      </nav>

      {selectedSection === Section.Library && (
        <div className="p-8">
          <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {collections.map((collection) => (
              <div key={collection.id} className="relative z-20 bg-white">
                <CollectionCard
                  isAdmin={true}
                  collection={{
                    id: collection.id?.toString() || "",
                    name: collection.name,
                    description: collection.description,
                    collectible_image_urls: collection.collectible_image_urls,
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedSection === Section.ChipManager && (
        <div className="container mx-auto p-4 py-10 space-y-8">
          <h1 className="text-3xl font-bold text-center mb-12">
            Chip Collectible Manager 🔐
          </h1>
          <AddChipForm />
          <ChipTable />
        </div>
      )}
    </div>
  );
}
