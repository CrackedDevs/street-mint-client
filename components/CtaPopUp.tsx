import { useState, useRef } from "react";
import { useReward } from "react-rewards";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "./ui/button";
import { Collectible, updateCollectible } from "@/lib/supabaseClient";
import { toast } from "@/hooks/use-toast";
import Link from "next/link";

interface CtaPopUpProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  logoUrl: string;
  logoAlt?: string;
  ctaText: string;
  ctaLink: string;
  hasEmailCapture: boolean;
  hasTextCapture: boolean;
  collectible: Collectible;
  publicKey: string;
  existingOrderId: string;
  // onSubmit?: (data: { email?: string; text?: string }) => void;
}

function CtaPopUp({
  isOpen,
  onClose,
  title,
  description,
  logoUrl,
  logoAlt = "Logo",
  ctaText,
  ctaLink,
  hasEmailCapture = false,
  hasTextCapture = false,
  collectible,
  publicKey,
  existingOrderId,
}: // onSubmit,
CtaPopUpProps) {
  const [email, setEmail] = useState("");
  const [text, setText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { reward: confettiReward, isAnimating } = useReward(
    "rewardId",
    "confetti",
    {
      elementCount: 100,
      spread: 70,
    }
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (ctaLink) {
      // Wait for confetti animation before redirect
      window.open(
        ctaLink.includes("http") ? ctaLink : `https://${ctaLink}`,
        "_blank"
      );
    }

    let updatedCollectible: Collectible = { ...collectible };

    if (hasEmailCapture) {
      updatedCollectible = {
        ...updatedCollectible,
        cta_email_list: [
          ...(collectible.cta_email_list || []),
          { [publicKey]: email },
        ],
      };
    }

    if (hasTextCapture) {
      updatedCollectible = {
        ...updatedCollectible,
        cta_text_list: [
          ...(collectible.cta_text_list || []),
          { [publicKey]: text },
        ],
      };
    }
    if (hasEmailCapture || hasTextCapture) {
      const response = await fetch("/api/cta/save-cta-data", {
        method: "PUT",
        body: JSON.stringify({
          collectible: updatedCollectible,
          orderId: existingOrderId,
          text: text,
          email: email,
        }),
      });
      const data = await response.json();
      if (data.success) {
        if (hasEmailCapture && hasTextCapture) {
          toast({
            title: "Thank you :)",
          });
        } else if (hasEmailCapture) {
          toast({
            title: "Thank you :)",
          });
        } else if (hasTextCapture) {
          toast({
            title: "Thank you :)",
          });
        }
      } else {
        toast({
          title: "Failed to update. Please try again.",
          description: data.error,
        });
      }
    }

    onClose();

    setIsLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="relative w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
        >
          <svg
            className="h-6 w-6"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>

        {/* Logo */}
        {logoUrl && (
          <div className="mb-4 flex justify-center">
            <Image
              src={logoUrl}
              alt={logoAlt}
              width={120}
              height={120}
              className="rounded-lg object-contain"
            />
          </div>
        )}

        {/* Content */}
        <h2 className="mb-2 text-2xl font-bold text-gray-900">{title}</h2>
        <p className="mb-6 text-gray-600">{description}</p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {hasTextCapture && (
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Enter your text"
              className="w-full rounded-lg border border-gray-300 px-4 py-2  focus:outline-none text-black"
              required
            />
          )}

          {hasEmailCapture && (
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full rounded-lg border border-gray-300 px-4 py-2  focus:outline-none text-black"
              required
            />
          )}

          {/* CTA Button with Reward */}
          <div className="flex justify-center">
            <Button
              type="submit"
              disabled={isLoading}
              className="relative rounded-lg  px-6 py-2 text-white transition-all  disabled:opacity-50"
            >
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" />
              {ctaText}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export { CtaPopUp };
