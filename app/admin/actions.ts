"use server";

import {
  getAllCollections,
  getCollectionsByArtistId,
} from "@/lib/supabaseClient";
import { cookies } from "next/headers";

export async function loginAdmin(password: string) {
  // Check if the password matches the environment variable
  if (password === process.env.ADMIN_PASSWORD) {
    // Set a simple auth cookie
    cookies().set({
      name: "admin-auth",
      value: "authenticated",
      httpOnly: true,
      path: "/",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24, // 24 hours
    });

    const fetchedCollections = await getAllCollections();
    return { success: true, collections: fetchedCollections };
  } else {
    return { success: false, collections: [] };
  }
}

export async function logoutAdmin() {
  // Clear the admin auth cookie
  cookies().delete("admin-auth");
  return { success: true };
}

export async function checkAdminSession() {
  // Check if the admin auth cookie exists
  const authCookie = cookies().get("admin-auth");

  if (authCookie) {
    const fetchedCollections = await getAllCollections();
    return { isLoggedIn: true, collections: fetchedCollections };
  }

  return { isLoggedIn: false, collections: [] };
}
