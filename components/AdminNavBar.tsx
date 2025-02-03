"use client";

import Link from "next/link";

export default function AdminNavBar() {

  return (
    <div>
      <nav className="bg-gray-800 p-4">
        <div className="container mx-auto flex justify-between items-center">
          <div className="text-white font-bold text-xl">StreetMint Admin Panel</div>
          <div className="space-x-4">
          <Link
              href="/admin"
              className="text-white hover:text-gray-300"
            >
              Library
            </Link>
            <Link
              href="/admin/chip-settings"
              className="text-white hover:text-gray-300"
            >
              Chips Manager
            </Link>
          </div>
        </div>
      </nav>
    </div>
  );
}
