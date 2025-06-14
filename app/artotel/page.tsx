"use client";

import FAQAccordion from "@/components/faq-accordion";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import type React from "react";
import { useState, useEffect } from "react";

const participantsFaqs = [
  {
    question: "What is a digital collectible?",
    answer: `It's like a unique digital asset (art, music, ticket, token etc) that only you can own and collect on your phone.

It's a fun new way brands and artists reward their loyal community for engaging with their brand in real life.

These digital assets can be traded or sold to other collectors on secondary marketplaces, potentially increasing their desirability and value over time.`,
  },
  {
    question: "Do I need any crypto or special apps to start?",
    answer: `Nope! Just your phone and your email address. We handle the rest.

You have the option to export your collectibles to a Solana wallet later if you want to explore more features like transferring or selling your collectibles.`,
  },
  {
    question: "How do I see the cool collectible I now own?",
    answer: `We'll send a link to your email where you can view it.

Your unique digital collectible is now permanently linked to your email where you can keep it, share it, or even trade and sell it on the secondary market!`,
  },
  {
    question: "Are these collectibles exclusive?",
    answer: `Yes! IRLS collectibles are only available to those who physically attend events or interact with locations featuring our chips, making them unique and scarce.`,
  },
  {
    question: "What are the benefits for me as a collector?",
    answer: `- **Fun Rewards for Being There**: Get cool digital goodies just for participating!  
- **Easy to Collect**: No complicated tech stuff needed to get started.  
- **Cool Digital Souvenirs**: Collect fun digital items from the places you go and things you do.  
- **Exclusive & Scarce**: These collectibles can only be obtained by being at the event with the IRLS chips.  
- **Potential for Extra Fun**: Some collectibles might unlock extra surprises down the road!`,
  },
];

const artistFaqs = [
  {
    question: "What is IRLS for Brands & Artists?",
    answer: `IRLS is the easiest way to connect with your audience in the real world and reward their presence with engaging digital collectibles.

Reach everyone with a simple tap and email entry, and gain valuable insights into who your most engaged fans are.

These unique IRLS collectibles are exclusively for attendees, creating a special connection with your brand.

Plus, you can design fun and engaging challenges for attendees to complete to unlock and collect different digital rewards – all with a simple tap and email entry!`,
  },
  {
    question: "What kind of digital assets can we give away?",
    answer: `You can distribute a wide range of digital collectibles, including:

- Limited edition art  
- Exclusive music tracks  
- Digital tokens  
- Popular memecoins  
- Digital currencies  
- Raffle tickets for exciting prizes  
- Access to your brand's loyalty and rewards programs  

**Contact us** to learn more about our exciting packages.`,
  },
  {
    question: "Why use IRLS for your events?",
    answer: `- **Maximum Participation**: Reach the widest audience – no crypto knowledge needed for attendees to join the fun.  
- **Make it Fun to Participate**: Give people a cool digital reward just for being there.  
- **See Who Your Real Fans Are**: Get valuable data (backed by the blockchain) on who's actually showing up to your events.  
- **Learn What Makes Your Audience Tick**: Collect emails from people who are engaging with you IRL.  
- **Reward Your Loyal Supporters**: Give extra special digital treats to those who participate the most.  
- **Drive Further Engagement with Custom CTAs**: After claiming their collectible, attendees can be presented with custom calls to action, such as following your social media channels, visiting a website, or learning about upcoming events.`,
  },
];

export default function IRLSArtotelPage() {
  
  return (
    <div className="min-h-screen bg-gray-100">
      <div
        className="bg-contain bg-center bg-no-repeat h-[32rem] md:h-[34rem]"
        style={{
          backgroundImage: "url('/artotel-faq-banner.jpg')",
        }}
      >
        {/* <div className="h-full bg-black bg-opacity-50 flex flex-col items-center justify-center space-y-4 md:space-y-6 px-4">
            <motion.p
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-xl md:text-2xl text-white text-center font-semibold"
            >
              The Shoreditch Street Art Mint Tour is brought to you by:
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="flex items-center justify-center space-x-8 md:space-x-24"
            >
              <Image
                src="/logo-white.svg"
                alt="Street Mint"
                width={200}
                height={200}
                className="h-20 md:h-48"
              />
              <span className="text-white text-3xl md:text-5xl font-bold">
                X
              </span>
              <Image
                src="/otz-logo-transparent.png"
                alt="OTZ"
                width={144}
                height={144}
                className="h-24 md:h-32 translate-x-2 md:translate-x-5"
              />
            </motion.div>
          </div> */}
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <Section title="Welcome to IRLS!">
          <p>
            Turn your presence and interactions into cool digital collectibles
            and unlock exciting rewards with the simplest tap. Collect with just
            your email - no crypto knowledge needed to get started!
          </p>
        </Section>

        <Section title="DOWNLOAD YOUR POCKET ART GUIDE HERE">
          <div className="space-y-4">
            <p>
              Get your comprehensive pocket guide to make the most of your IRLS experience!
            </p>
            <div className="border border-gray-300 rounded-lg overflow-hidden">
              <iframe
                src="/artotel-guide.pdf"
                className="w-full h-[650px]"
                title="IRLS Pocket Art Guide"
              />
            </div>
            <div className="flex justify-center">
              <a
                href="/artotel-guide.pdf"
                download="artotel-pocket-art-guide.pdf"
                className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                Download PDF Guide
              </a>
            </div>
          </div>
        </Section>

        <Section title="What is IRLS?">
          <p>
            IRLS connects your real-world engagement to unique digital
            collectibles and rewards. Simply tap your phone on an IRLS NFC Chip
            and unlock a new way to experience events, art and brand
            interactions.
          </p>
        </Section>

        <Section title="How does it work?">
          <ul className="list-disc list-inside space-y-2">
            <li>
              <strong>Tap:</strong> Find the IRLS chip and tap it with your
              phone.
            </li>
            <li>
              <strong>Enter Your Email:</strong> Just type in your email address
              and hit collect - that&apos;s it!
            </li>
            <li>
              <strong>Claim Your Goodie:</strong> Your unique digital
              collectible is now yours, delivered straight to your inbox with a
              link to view. You can optionally claim it with a Solana wallet or
              .sol domain for more features.
            </li>
          </ul>
        </Section>

        <Section title="How To Video">
          <video
            src="/artotel-how-to-video.mp4"
            className="w-full h-auto"
            controls
          />
        </Section>

        <Section title="Why IRLS?">
          <ul className="list-disc list-inside space-y-2">
            <li>
              Collect with Ease: If you can use email, you can collect with
              IRLS.
            </li>
            <li>Fun Rewards for Being There.</li>
            <li>
              Collect Unique Digital Items: Exclusive art, memecoins, digital
              tokens, and mementos.
            </li>
            <li>
              Maybe Unlock Extra Goodies: Some might grant access to perks or
              future fun!
            </li>
          </ul>
        </Section>

        <Section title="FAQs for Participants">
          <FAQAccordion loaded={participantsFaqs} />
        </Section>

        <Section title="FAQs for Brands & Artists">
          <FAQAccordion loaded={artistFaqs} />
        </Section>

        <Section title="IRLS for Brands & Artists: Supercharge Your IRL Activations with Flexible Solutions">
          <p>
            IRLS offers two powerful solutions - &quot;IRLS Connect&quot; and
            &quot;IRLS Go&quot; - designed to meet the diverse needs of your
            audience, whether they are Web3 enthusiasts or completely new to the
            digital asset space.
          </p>
          <Table className="my-4 border border-gray-300">
            <TableHeader>
              <TableRow className="bg-gray-100 border-b border-gray-300">
                <TableHead className="font-bold text-sm border-r border-gray-300">
                  Feature
                </TableHead>
                <TableHead className="font-bold text-sm border-r border-gray-300">
                  IRLS Connect
                </TableHead>
                <TableHead className="font-bold text-sm">IRLS Go</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow className="bg-gray-100 border-b border-gray-300">
                <TableCell className="border-r border-gray-300">
                  Claim Options
                </TableCell>
                <TableCell className="border-r border-gray-300">
                  Email, Solana wallet, .SOL domain
                </TableCell>
                <TableCell>Email only (wallet optional later)</TableCell>
              </TableRow>
              <TableRow className="bg-background border-b border-gray-300">
                <TableCell className="border-r border-gray-300">
                  Ease of Use
                </TableCell>
                <TableCell className="border-r border-gray-300">
                  Slightly more steps for full ownership
                </TableCell>
                <TableCell>Very easy, email-only flow</TableCell>
              </TableRow>
              <TableRow className="bg-gray-100 border-b border-gray-300">
                <TableCell className="border-r border-gray-300">
                  Wallet Requirement
                </TableCell>
                <TableCell className="border-r border-gray-300">
                  None needed to start
                </TableCell>
                <TableCell>None needed to start</TableCell>
              </TableRow>
              <TableRow className="bg-background border-b border-gray-300">
                <TableCell className="border-r border-gray-300">
                  Latency
                </TableCell>
                <TableCell className="border-r border-gray-300">
                  May vary due to blockchain
                </TableCell>
                <TableCell>Near instant (chain later)</TableCell>
              </TableRow>
              <TableRow className="bg-gray-100 border-b border-gray-300">
                <TableCell className="border-r border-gray-300">
                  Ownership
                </TableCell>
                <TableCell className="border-r border-gray-300">
                  Immediate via wallet or background creation
                </TableCell>
                <TableCell>Delayed, linked to email</TableCell>
              </TableRow>
              <TableRow className="bg-background border-b border-gray-300">
                <TableCell className="border-r border-gray-300">
                  Best For
                </TableCell>
                <TableCell className="border-r border-gray-300">
                  Web3-savvy and general audiences
                </TableCell>
                <TableCell>Web2-friendly, noob-safe</TableCell>
              </TableRow>
              <TableRow className="bg-gray-100">
                <TableCell className="border-r border-gray-300">
                  Data & Analytics
                </TableCell>
                <TableCell className="border-r border-gray-300">
                  Emails + Wallets (on-chain data)
                </TableCell>
                <TableCell>Emails only</TableCell>
              </TableRow>
              <TableRow className="bg-background">
                <TableCell className="border-r border-gray-300">Cost</TableCell>
                <TableCell className="border-r border-gray-300">
                  $175+, small gas fee (brand covers)
                </TableCell>
                <TableCell>$175+, lower gas at scale</TableCell>
              </TableRow>
            </TableBody>
          </Table>

          <p>
            In a nutshell: Both IRLS Connect and Go prioritise a seamless,
            email-first collection experience, making real-world digital rewards
            accessible to everyone, regardless of their crypto knowledge, while
            offering different levels of immediate blockchain interaction and
            ownership.
          </p>
        </Section>

        <Section title="Get Involved!">
          <p>
            Are you an artist, gallery, local council, or street art enthusiast?
            We&apos;d love to hear from you! Join us in bringing IRLS to your
            city and transforming the way we experience and collect art.
          </p>
          <Link href="/contact-us">
            <Button className="mt-4">Contact Us</Button>
          </Link>
        </Section>
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mb-12"
    >
      <h2 className="text-3xl font-bold mb-4 text-gray-800">{title}</h2>
      <div className="text-gray-700">{children}</div>
    </motion.section>
  );
}
