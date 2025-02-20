"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    question: "What is a digital collectible?",
    answer:
      'A digital collectible is an NFT, which stands for "Non-Fungible Token." It\'s a unique digital asset that represents ownership of a specific item, like a piece of art or a collectible.',
  },
  {
    question: "What is Solana?",
    answer:
      "Solana is a fast and efficient blockchain platform that powers our digital collectibles.",
  },
  {
    question: "Do I need a crypto wallet?",
    answer:
      "No. You can claim / purchase one of our digital collectibles with just an email address. We create a wallet for you in the background which you can access whenever you want.",
  },
  {
    question: "How do I view my digital collectible?",
    answer:
      "You'll receive an email with a link to view and manage your digital collectible. You can also view it on popular digital art marketplaces like Magic Eden.",
  },
  {
    question: "What can I do with my digital collectible?",
    answer:
      "You can collect it, display it in your digital gallery, share it on social media, or even sell it on a secondary art marketplace.",
  },
  {
    question: "Can I share the link with others so they can claim it also?",
    answer:
      "No. Each tap generates a unique, disposable link to ensure only the person physically present at the mural can claim the digital collectible.",
  },
  {
    question: "How many free digital collectibles can I claim?",
    answer:
      "Free claims are limited to one per person (verified by email). Once the free editions are gone, you can purchase unlimited editions.",
  },
  {
    question: "Who is OTZ Gallery?",
    answer:
      "OTZ Gallery is a leading curator of contemporary and street art in London. They have partnered with Street Mint to bring you this exciting collection of NFTs, showcasing the work of renowned artists and transforming Shoreditch into a digital art gallery. Learn more about OTZ Gallery and their mission at https://outsidethezonegallery.com/.",
  },
];

export default function FAQAccordion() {
  return (
    <div className="space-y-4 pt-2">
      {faqs.map((faq, index) => (
        <FAQItem key={index} question={faq.question} answer={faq.answer} />
      ))}
    </div>
  );
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden">
      <button
        className="flex justify-between items-center w-full text-left p-4 focus:outline-none"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="text-lg font-semibold text-gray-800">{question}</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <ChevronDown className="w-5 h-5 text-gray-500" />
        </motion.div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="p-4 bg-gray-50">
              <p className="text-gray-600">{answer}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
