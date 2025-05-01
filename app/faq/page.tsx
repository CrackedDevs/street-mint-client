"use client";

import FAQAccordion from "@/components/faq-accordion";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import type React from "react";
const participantsFaqs = [
  {
    question: "What is a digital collectible?",
    answer: `It's like a unique digital asset (art, music, ticket, token etc) that only you can own and collect on your phone.

It’s a fun new way brands and artists reward their loyal community for engaging with their brand in real life.

These digital assets can be traded or sold to other collectors on secondary marketplaces, potentially increasing their desirability and value over time.`
  },
  {
    question: "Do I need any crypto or special apps to start?",
    answer: `Nope! Just your phone and your email address. We handle the rest.

You have the option to export your collectibles to a Solana wallet later if you want to explore more features like transferring or selling your collectibles.`
  },
  {
    question: "How do I see the cool collectible I now own?",
    answer: `We'll send a link to your email where you can view it.

Your unique digital collectible is now permanently linked to your email where you can keep it, share it, or even trade and sell it on the secondary market!`
  },
  {
    question: "Are these collectibles exclusive?",
    answer: `Yes! IRLS collectibles are only available to those who physically attend events or interact with locations featuring our chips, making them unique and scarce.`
  },
  {
    question: "What are the benefits for me as a collector?",
    answer: `- **Fun Rewards for Being There**: Get cool digital goodies just for participating!  
- **Easy to Collect**: No complicated tech stuff needed to get started.  
- **Cool Digital Souvenirs**: Collect fun digital items from the places you go and things you do.  
- **Exclusive & Scarce**: These collectibles can only be obtained by being at the event with the IRLS chips.  
- **Potential for Extra Fun**: Some collectibles might unlock extra surprises down the road!`
  }
];

const artistFaqs = [
  {
    question: "What is IRLS for Brands & Artists?",
    answer: `IRLS is the easiest way to connect with your audience in the real world and reward their presence with engaging digital collectibles.

Reach everyone with a simple tap and email entry, and gain valuable insights into who your most engaged fans are.

These unique IRLS collectibles are exclusively for attendees, creating a special connection with your brand.

Plus, you can design fun and engaging challenges for attendees to complete to unlock and collect different digital rewards – all with a simple tap and email entry!`
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

**Contact us** to learn more about our exciting packages.`
  },
  {
    question: "Why use IRLS for your events?",
    answer: `- **Maximum Participation**: Reach the widest audience – no crypto knowledge needed for attendees to join the fun.  
- **Make it Fun to Participate**: Give people a cool digital reward just for being there.  
- **See Who Your Real Fans Are**: Get valuable data (backed by the blockchain) on who's actually showing up to your events.  
- **Learn What Makes Your Audience Tick**: Collect emails from people who are engaging with you IRL.  
- **Reward Your Loyal Supporters**: Give extra special digital treats to those who participate the most.  
- **Drive Further Engagement with Custom CTAs**: After claiming their collectible, attendees can be presented with custom calls to action, such as following your social media channels, visiting a website, or learning about upcoming events.`
  }
];

export default function StreetMintPage() {
  const currentOrigin = window.location.origin;

  if (currentOrigin === "https://www.irls.xyz" || currentOrigin === "http://localhost:3000") {
    return (
      <div className="min-h-screen bg-gray-100">
        <div
          className="bg-cover bg-center h-[32rem] md:h-[34rem]"
          style={{
            backgroundImage: "url('/banner-image.jpeg')",
          }}
        >
          <div className="h-full bg-black bg-opacity-50 flex flex-col items-center justify-center space-y-4 md:space-y-6 px-4">
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
              <span className="text-white text-3xl md:text-5xl font-bold">X</span>
              <Image
                src="/otz-logo-transparent.png"
                alt="OTZ"
                width={144}
                height={144}
                className="h-24 md:h-32 translate-x-2 md:translate-x-5"
              />
            </motion.div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-12">
          <Section title="Welcome to IRLS!">
            <p>
              Turn your presence and interactions into cool digital collectibles and unlock exciting
              rewards with the simplest tap. Collect with just your email – no crypto knowledge needed
              to get started!
            </p>
          </Section>

          <Section title="What is IRLS?">
            <p>
              IRLS connects your real-world engagement to unique digital collectibles and rewards.
              Simply tap your phone on an IRLS NFC Chip and unlock a new way to experience events, art
              and brand interactions.
            </p>
          </Section>

          <Section title="How does it work?">
            <ul className="list-disc list-inside space-y-2">
              <li><strong>Tap:</strong> Find the IRLS chip and tap it with your phone.</li>
              <li><strong>Enter Your Email:</strong> Just type in your email address and hit collect – that&apos;s it!</li>
              <li><strong>Claim Your Goodie:</strong> Your unique digital collectible is now yours, delivered straight to your inbox
                with a link to view. You can optionally claim it with a Solana wallet or .sol domain for more features.</li>
            </ul>
          </Section>

          <Section title="Why IRLS?">
            <ul className="list-disc list-inside space-y-2">
              <li>Collect with Ease: If you can use email, you can collect with IRLS.</li>
              <li>Fun Rewards for Being There.</li>
              <li>Collect Unique Digital Items: Exclusive art, memecoins, digital tokens, and mementos.</li>
              <li>Maybe Unlock Extra Goodies: Some might grant access to perks or future fun!</li>
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
              IRLS offers two powerful solutions – “IRLS Connect” and “IRLS Go” – designed to meet the diverse needs of your audience,
              whether they are Web3 enthusiasts or completely new to the digital asset space.
            </p>
            <Table className="my-4 border border-gray-300">
              <TableHeader>
                <TableRow className="bg-gray-100 border-b border-gray-300">
                  <TableHead className="font-bold text-sm border-r border-gray-300">Feature</TableHead>
                  <TableHead className="font-bold text-sm border-r border-gray-300">IRLS Connect (STANDARD)</TableHead>
                  <TableHead className="font-bold text-sm">IRLS Go (LIGHT)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow className="bg-gray-100 border-b border-gray-300">
                  <TableCell className="border-r border-gray-300">Claim Options</TableCell>
                  <TableCell className="border-r border-gray-300">Email, Solana wallet, .SOL domain</TableCell>
                  <TableCell>Email only (wallet optional later)</TableCell>
                </TableRow>
                <TableRow className="bg-background border-b border-gray-300">
                  <TableCell className="border-r border-gray-300">Ease of Use</TableCell>
                  <TableCell className="border-r border-gray-300">Slightly more steps for full ownership</TableCell>
                  <TableCell>Very easy, email-only flow</TableCell>
                </TableRow>
                <TableRow className="bg-gray-100 border-b border-gray-300">
                  <TableCell className="border-r border-gray-300">Wallet Requirement</TableCell>
                  <TableCell className="border-r border-gray-300">None needed to start</TableCell>
                  <TableCell>None needed to start</TableCell>
                </TableRow>
                <TableRow className="bg-background border-b border-gray-300">
                  <TableCell className="border-r border-gray-300">Latency</TableCell>
                  <TableCell className="border-r border-gray-300">May vary due to blockchain</TableCell>
                  <TableCell>Near instant (chain later)</TableCell>
                </TableRow>
                <TableRow className="bg-gray-100 border-b border-gray-300">
                  <TableCell className="border-r border-gray-300">Ownership</TableCell>
                  <TableCell className="border-r border-gray-300">Immediate via wallet or background creation</TableCell>
                  <TableCell>Delayed, linked to email</TableCell>
                </TableRow>
                <TableRow className="bg-background border-b border-gray-300">
                  <TableCell className="border-r border-gray-300">Best For</TableCell>
                  <TableCell className="border-r border-gray-300">Web3-savvy and general audiences</TableCell>
                  <TableCell>Web2-friendly, noob-safe</TableCell>
                </TableRow>
                <TableRow className="bg-gray-100">
                  <TableCell className="border-r border-gray-300">Data & Analytics</TableCell>
                  <TableCell className="border-r border-gray-300">Emails + Wallets (on-chain data)</TableCell>
                  <TableCell>Emails only</TableCell>
                </TableRow>
                <TableRow className="bg-background">
                  <TableCell className="border-r border-gray-300">Cost</TableCell>
                  <TableCell className="border-r border-gray-300">$175+, small gas fee (brand covers)</TableCell>
                  <TableCell>$175+, lower gas at scale</TableCell>
                </TableRow>
              </TableBody>
            </Table>

            <p>
              In a nutshell: Both IRLS Connect and Go prioritise a seamless, email-first collection experience,
              making real-world digital rewards accessible to everyone, regardless of their crypto knowledge,
              while offering different levels of immediate blockchain interaction and ownership.
            </p>
          </Section>

          <Section title="Get Involved!">
            <p>
              Are you an artist, gallery, local council, or street art enthusiast?
              We&apos;d love to hear from you! Join us in bringing IRLS to
              your city and transforming the way we experience and collect art.
            </p>
            <Link href="/contact-us">
              <Button className="mt-4">Contact Us</Button>
            </Link>
          </Section>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div
        className="bg-cover bg-center h-[32rem] md:h-[34rem]"
        style={{
          backgroundImage: "url('/banner-image.jpeg')",
        }}
      >
        <div className="h-full bg-black bg-opacity-50 flex flex-col items-center justify-center space-y-4 md:space-y-6 px-4">
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
            <span className="text-white text-3xl md:text-5xl font-bold">X</span>
            <Image
              src="/otz-logo-transparent.png"
              alt="OTZ"
              width={144}
              height={144}
              className="h-24 md:h-32 translate-x-2 md:translate-x-5"
            />
          </motion.div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <Section title="Welcome">
          <p>
            You&apos;ve discovered a Street Mint station, your gateway to owning
            a unique piece of the urban landscape! We&apos;re revolutionising
            street art by turning murals into digital collectibles that you can
            hunt, collect, own and trade.
          </p>
          <p className="mt-4">
            If you know how to use an email, you can own one of our Street Mint
            digital collectibles with ease. No wallet, crypto or special
            knowledge needed.
          </p>
        </Section>

        <Section title="What is Street Mint?">
          <p>
            Street Mint is a platform that allows you to collect digital
            collectibles of the amazing street art you see around you. We
            believe in empowering artists, supporting local communities and
            making art collecting accessible to everyone. But we also believe in
            the power of experience and being in the moment. That&apos;s why
            we&apos;ve designed our platform to be truly experiential and
            location-based.
          </p>
          <p className="mt-4">
            <strong>Here&apos;s the catch:</strong> You can ONLY claim this
            digital collectible by tapping the Mint Station in person, you
            cannot access it online or share the link with others. The only
            other way to acquire it is by buying it from a seller on a secondary
            marketplace (but probably at a much higher price).
          </p>
        </Section>

        <Section title="How Does it Work?">
          <p>It&apos;s as easy as 1, 2, 3!</p>
          <ol className="list-decimal list-inside mt-4 space-y-2">
            <li>
              <strong>Tap & Claim:</strong> Find the NFC reader on your phone (
              <a
                href="https://youtube.com/shorts/blv-d6YkA3E?si=Uwur12s-l_IaNruX"
                target="_blank"
                className="text-blue-500"
              >
                Android click here
              </a>
              ). Simply tap your phone on the &quot;X&quot; located on this Mint
              Station.
            </li>
            <li>
              <strong>Enter Details:</strong> You&apos;ll be prompted to enter
              your email address (and payment information if all the free
              editions have been claimed - we accept credit card and Solana).
            </li>
            <li>
              <strong>Own Your Art:</strong> That&apos;s it! Your unique digital
              collectible will be delivered straight to your email inbox. You
              can view it, share it, or even sell it on secondary art
              marketplaces.
            </li>
          </ol>
        </Section>

        <Section title="Why Street Mint?">
          <ul className="list-disc list-inside space-y-2">
            <li>
              <strong>Support Artists:</strong> Your purchase directly supports
              the artists who create these incredible murals.
            </li>
            <li>
              <strong>Own a Piece of the City:</strong> Collect unique digital
              collectibles of your favorite street art.
            </li>
            <li>
              <strong>Gasless Minting:</strong> We cover all blockchain
              transaction fees, making collecting accessible to everyone who has
              an email address.
            </li>
            <li>
              <strong>Fiat & Crypto Payments:</strong> Pay with a credit card or
              cryptocurrency (Solana).
            </li>
            <li>
              <strong>Easy & Inclusive:</strong> No prior knowledge of crypto is
              required.
            </li>
            <li>
              <strong>Exclusive & Experiential:</strong> Only those who visit
              the mural in person can claim the digital collectible, making it a
              truly special and limited collectible.
            </li>
          </ul>
        </Section>

        <Section title="Frequently Asked Questions">
          <FAQAccordion />
        </Section>

        <Section title="Get Involved!">
          <p>
            Are you an artist, gallery, local council, or street art enthusiast?
            We&apos;d love to hear from you! Join us in bringing Street Mint to
            your city and transforming the way we experience and collect art.
          </p>
          <Link href="/contact-us">
            <Button className="mt-4">Contact Us</Button>
          </Link>
        </Section>

        <Section title="About Us">
          <h3 className="text-xl font-semibold mb-4">Our Mission:</h3>
          <ul className="list-disc list-inside space-y-2 mb-6">
            <li>
              Empower artists by providing new revenue streams and creative
              opportunities.
            </li>
            <li>
              <strong>World&apos;s Largest Collection:</strong> Create the
              world&apos;s largest decentralized art gallery, open 24/7 and
              accessible to everyone.
            </li>
            <li>Bring exposure to street artists and their incredible work.</li>
            <li>
              Encourage everyone to become art collectors, regardless of their
              background or budget.
            </li>
            <li>
              Gamify the art collecting experience, making it fun and engaging.
            </li>
            <li>Make art collecting free, accessible, and inclusive.</li>
          </ul>

          <h3 className="text-xl font-semibold mb-4">
            Addressing the Challenges in the Street Art World:
          </h3>
          <ul className="list-disc list-inside space-y-2 mb-6">
            <li>
              <strong>Street Art Undervalued:</strong> Street art often lacks
              the recognition and economic value it deserves.
            </li>
            <li>
              <strong>Limited Accessibility:</strong> Accessing and collecting
              street art is challenging for most enthusiasts.
            </li>
            <li>
              <strong>Lack of Provenance:</strong> Authenticating and tracking
              ownership of street art is difficult.
            </li>
            <li>
              <strong>Limited Incentives:</strong> Historically, councils,
              governments and wall owners have lacked financial motivation to
              host street art, missing potential revenue opportunities.
            </li>
          </ul>

          <h3 className="text-xl font-semibold mb-4">
            Street Mint: The Solution
          </h3>
          <ul className="list-disc list-inside space-y-2 mb-6">
            <li>
              <strong>Concept:</strong> A platform that allows artists to mint
              digital collectibles of their street art murals, making them
              collectible and verifiable on the blockchain.
            </li>
            <li>
              <strong>Accessibility:</strong> Collectors can discover and mint
              these digital collectibles by physically visiting the murals and
              using their smartphones.
            </li>
            <li>
              <strong>Fair Distribution:</strong> Artists can choose limited
              editions or 1-of-1 digital collectibles, creating scarcity and
              excitement.
            </li>
            <li>
              <strong>Gasless Minting:</strong> Eliminate blockchain transaction
              fees to create the world&apos;s most user friendly art collecting
              experience.
            </li>
            <li>
              <strong>Fiat and Crypto Payments:</strong> Cater to a wider
              audience by accepting both traditional credit card payments and
              cryptocurrencies.
            </li>
          </ul>

          <h3 className="text-xl font-semibold mb-4">
            Benefits for Street Art Enthusiasts & Collectors:
          </h3>
          <ul className="list-disc list-inside space-y-2 mb-6">
            <li>
              <strong>Own a Piece of the City:</strong> Collect unique digital
              versions of your favorite street art murals and own a piece of the
              urban landscape forever.
            </li>
            <li>
              <strong>Experience Art in a New Way:</strong> Immerse yourself in
              the art world like never before! Discover hidden gems, interact
              with murals, and unlock exclusive digital content.
            </li>
            <li>
              <strong>Invest in the Future of Art:</strong> Acquire digital
              collectibles of street art that could increase in value over time
              as the artists gain recognition and the popularity of digital
              collectibles grows.
            </li>
            <li>
              <strong>Support the Artists You Love:</strong> Your purchase
              directly supports the talented artists who bring vibrancy and life
              to our cities.
            </li>
          </ul>

          <h3 className="text-xl font-semibold mb-4">
            Benefits for Artists & Galleries:
          </h3>
          <ul className="list-disc list-inside space-y-2 mb-6">
            <li>
              <strong>Unlock New Revenue Streams:</strong> Transform your street
              art into a new income source! Sell limited-edition digital
              collectibles directly to fans and earn royalties on every
              secondary market sale.
            </li>
            <li>
              <strong>Reach a Global Audience:</strong> Showcase your art to a
              worldwide community of collectors and enthusiasts eager to
              discover and own unique pieces.
            </li>
            <li>
              <strong>Protect Your Work:</strong> Establish undeniable
              provenance and safeguard your art from forgery using blockchain
              technology. Your digital signature is embedded in every digital
              collectible.
            </li>
            <li>
              <strong>Grow Your Fanbase:</strong> Connect with collectors in a
              whole new way. Build a loyal following and create a thriving
              community around your art.
            </li>
            <li>
              <strong>Maintain Creative Control:</strong> You decide everything!
              Set your own edition sizes, pricing, and royalty percentages. Want
              to release a million editions at $1 each? You have the power.
            </li>
          </ul>

          <h3 className="text-xl font-semibold mb-4">
            Benefits for Wall Owners:
          </h3>
          <ul className="list-disc list-inside space-y-2 mb-6">
            <li>
              <strong>Turn Your Walls into Revenue Streams:</strong> Earn a
              percentage of every digital collectible sale directly from your
              wall. The more prominent the location, the more you could earn!
            </li>
            <li>
              <strong>Boost Your Business:</strong> Attract art enthusiasts and
              tourists to your location, increasing foot traffic and potential
              customers.
            </li>
            <li>
              <strong>Become a Cultural Hotspot:</strong> Showcase stunning
              street art and contribute to the vibrant cultural landscape of
              your community.
            </li>
            <li>
              <strong>Engage Your Community:</strong> Foster a sense of local
              pride and ownership by turning your walls into interactive art
              experiences.
            </li>
            <li>
              <strong>Earn Ongoing Royalties:</strong> Enjoy a continuous
              revenue stream from secondary market sales of the digital
              collectibles. Even after the initial mints sell out, you&apos;ll
              continue to earn royalties every time the digital asset changes
              hands.
            </li>
          </ul>
        </Section>

        <Section title="Get Involved!">
          <p>
            Are you an artist, gallery, local council, or street art enthusiast?
            We&apos;d love to hear from you! Join us in bringing Street Mint to
            your city and transforming the way we experience and collect art.
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
