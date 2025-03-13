"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { checkAdminSession } from "../actions";
import { Button } from "@/components/ui/button";
import AddChipForm from "@/components/AddChipForm";
import ChipTable from "@/components/ChipTable";
import {
  ChipLink,
  createChipLink,
  getAllChipLinks,
  ChipLinkCreate,
  deleteChipLink,
  updateChipLink,
  ChipLinkDetailed,
} from "@/lib/supabaseAdminClient";

export default function AdminDashboard() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [chipLinks, setChipLinks] = useState<ChipLinkDetailed[]>([]);

  useEffect(() => {
    const checkSession = async () => {
      const { isLoggedIn } = await checkAdminSession();
      setIsLoggedIn(isLoggedIn);
      if (isLoggedIn) {
        fetchChipLinks();
      } else {
        // Redirect to login page if not logged in
        router.push("/admin");
      }
      setIsLoading(false);
    };

    checkSession();
  }, [router]);

  const fetchChipLinks = async () => {
    const links = await getAllChipLinks();
    console.log("links", links);
    if (links) {
      setChipLinks(links);
    }
  };

  const addChipLink = async (chipLink: ChipLinkCreate) => {
    const result = await createChipLink(chipLink);
    if (result) {
      fetchChipLinks();
    }
  };

  const handleDeleteChipLink = async (id: number) => {
    await deleteChipLink(id);
    fetchChipLinks();
  };

  const handleUpdateChipLink = async (id: number, chipLink: ChipLink) => {
    await updateChipLink(id, chipLink);
    fetchChipLinks();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 py-10 space-y-8">
      <h1 className="text-3xl font-bold text-center mb-12">
        Dashboard
      </h1>
      
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-2xl font-bold mb-4">Chip Collectible Manager 🔐</h2>
        <p className="text-gray-600 mb-6">
          Assign and manage NFC chips for artists and collectibles. Add new chip links, update existing ones, or remove them as needed.
        </p>
        <AddChipForm onAddChipLink={addChipLink} />
      </div>
      
      <ChipTable
        chipLinks={chipLinks}
        onDelete={handleDeleteChipLink}
        onUpdate={handleUpdateChipLink}
      />
    </div>
  );
} 