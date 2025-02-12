"use client";

import { motion } from "framer-motion";
import FAQAccordion from "@/components/faq-accordion";
import { Button } from "@/components/ui/button";
import type React from "react";
import Link from "next/link";

export default function StreetMintPage() {
  return (
    <div className="min-h-screen bg-gray-100">
      <div
        className="bg-cover bg-center h-[34rem]"
        style={{
          backgroundImage: "url('/banner-image.jpg')",
        }}
      >
        <div className="h-full bg-black bg-opacity-50 flex items-center justify-center">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-5xl font-bold text-white text-center"
          >
            Welcome to Street Mint!
          </motion.h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <Section title="Welcome">
          <p>
            You&apos;ve discovered a Street Mint station, your gateway to owning a
            unique piece of the urban landscape! We&apos;re revolutionising street
            art by turning murals into digital collectibles that you can hunt,
            collect, own and trade.
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
            the power of experience and being in the moment. That&apos;s why we&apos;ve designed our platform to be truly experiential and location-based.
          </p>
          <p className="mt-4">
            <strong>Here&apos;s the catch:</strong> You can ONLY claim this digital
            collectible by tapping the Mint Station in person, you cannot access
            it online or share the link with others. The only other way to
            acquire it is by buying it from a seller on a secondary marketplace
            (but probably at a much higher price).
          </p>
        </Section>

        <Section title="How Does it Work?">
          <p>It&apos;s as easy as 1, 2, 3!</p>
          <ol className="list-decimal list-inside mt-4 space-y-2">
            <li>
              <strong>Tap & Claim:</strong> Simply tap your phone on the &quot;X&quot;
              located on this Mint Station.
            </li>
            <li>
              <strong>Enter Details:</strong> You&apos;ll be prompted to enter your
              email address (and payment information if all the free editions
              have been claimed).
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
            We&apos;d love to hear from you! Join us in bringing Street Mint to your
            city and transforming the way we experience and collect art.
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
              world&apos;s largest decentralized art gallery, open 24/7
              and accessible to everyone.
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
              audience by accepting both traditional and cryptocurrencies.
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
            We&apos;d love to hear from you! Join us in bringing Street Mint to your
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
