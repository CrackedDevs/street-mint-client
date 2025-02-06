import { useState, useRef } from 'react';
import { useReward } from 'react-rewards';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

interface CtaPopUpProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  logoUrl?: string;
  logoAlt?: string;
  ctaText: string;
  ctaLink?: string;
  hasEmailCapture?: boolean;
  hasTextCapture?: boolean;
  onSubmit?: (data: { email?: string; text?: string }) => void;
}

function CtaPopUp({
  isOpen,
  onClose,
  title,
  description,
  logoUrl,
  logoAlt = 'Logo',
  ctaText,
  ctaLink,
  hasEmailCapture = false,
  hasTextCapture = false,
  onSubmit,
}: CtaPopUpProps) {
  const [email, setEmail] = useState('');
  const [text, setText] = useState('');
  const { reward: confettiReward, isAnimating } = useReward('rewardId', 'confetti', {
    elementCount: 100,
    spread: 70,
  });
const router = useRouter()
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (onSubmit) {
      onSubmit({ email: hasEmailCapture ? email : undefined, text: hasTextCapture ? text : undefined });
    }
    
    confettiReward();
    
    if (ctaLink) {
      // Wait for confetti animation before redirect
      setTimeout(() => {
        window.open(ctaLink, '_blank');
      }, 1000);
    }
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
          {hasEmailCapture && (
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none text-black"
              required
            />
          )}

          {hasTextCapture && (
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Enter your text"
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
              required
            />
          )}

          {/* CTA Button with Reward */}
          <div className="flex justify-center">
            <button
              type="submit"
              disabled={isAnimating}
              className="relative rounded-lg bg-blue-600 px-6 py-2 text-white transition-all hover:bg-blue-700 disabled:opacity-50"
            >
              <span id="rewardId" className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" />
              {ctaText}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export { CtaPopUp };
