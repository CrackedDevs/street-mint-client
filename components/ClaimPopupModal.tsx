"use client";

import { useState, useEffect, useRef } from "react";

export default function ClaimPopupModal() {
  const [isOpen, setIsOpen] = useState(true);
  const modalRef = useRef<HTMLDivElement>(null);

  const closeModal = () => {
    setIsOpen(false);
  };

  // Close when clicking outside the modal
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        closeModal();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center">
      <div 
        ref={modalRef}
        className="bg-white p-10 rounded-lg shadow-xl max-w-md w-full mx-auto text-center"
        style={{ maxWidth: "480px", borderRadius: "15px" }}
      >
        <h2 className="text-2xl font-bold mb-10 text-gray-800">ALMOST THERE 🚀</h2>
        <p className="text-lg mb-4 text-gray-700">
          To claim your IRLS collectible you&#39;ll need a Solana wallet.
        </p>
        <p className="text-lg mb-12 text-gray-700">
          Follow the steps on this page.
        </p>
        <button
          onClick={closeModal}
          className="bg-black text-white py-2 px-10 rounded-full text-lg font-semibold tracking-wider hover:bg-gray-800 transition-colors"
          style={{ minWidth: "160px" }}
        >
          ✨ GO ✨
        </button>
      </div>
    </div>
  );
} 