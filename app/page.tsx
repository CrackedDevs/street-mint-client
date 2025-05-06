"use client";
import {
  CollectibleDetailed,
  fetchAllCollectibles,
} from "@/lib/supabaseClient";
import { Wallet, ShoppingBag, ChevronRight, Cpu } from "lucide-react";
import { useEffect, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import CollectibleMegaCard from "@/components/collectibleMegaCard";
import Link from "next/link";

export default function LandingPage() {
  const [collectibles, setCollectibles] = useState<CollectibleDetailed[]>([]);
  const [isIrlsDomain, setIsIrlsDomain] = useState(false);
  const [brandName, setBrandName] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsIrlsDomain(window.location.hostname === "www.irls.xyz");
    console.log("hostname:", window.location.hostname);
  }, []);

  useEffect(() => {
    setBrandName(isIrlsDomain ? "IRLS" : "Street Mint");
  }, [isIrlsDomain]);

  useEffect(() => {
    async function fetchCollectibles() {
      setIsLoading(true);
      try {
        const response = await fetchAllCollectibles(0, 10);
        if (!response) {
          throw new Error("Failed to fetch collectibles data");
        }

        const { collectibles: newCollectibles, hasMore: moreAvailable } =
          response;

        setCollectibles(newCollectibles);
      } catch (error) {
        console.error("Error in fetchCollections:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchCollectibles();
  }, []);

  // Helper function to render loading state
  const renderLoading = () => (
    <div className="flex justify-center items-center py-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
    </div>
  );

  return (
    <div className="bg-white">
      <header className="absolute inset-x-0 top-0 z-50">
        <nav className="flex justify-center p-6 lg:px-8" aria-label="Global">
          <a href="#" className="-m-1.5 p-1.5">
            <span className="sr-only">{brandName}</span>
            <Image
              src={isIrlsDomain ? "/irlLogo.svg" : "/logo.svg"}
              alt={isIrlsDomain ? "IRLS logo" : "Street mint logo"}
              width={250}
              height={100}
              className="h-10 w-auto"
            />
          </a>
        </nav>
      </header>

      <main className="isolate">
        {/* Feature section */}
        <div className="mx-auto mt-32 max-w-7xl px-6 sm:mt-56 lg:px-8">
          <div className="mx-auto max-w-2xl lg:text-center">
            <h2 className="text-base font-semibold leading-7 text-gray-900">
              Revolutionize Collectibles
            </h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Everything you need to create and share digital collectibles
            </p>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              {brandName} combines the power of Solana blockchain with NFC
              technology to bring your digital collectibles into the physical
              world.
            </p>
            <p className="mt-6 text-lg leading-8 text-gray-900 font-semibold">
              Want to work with {brandName}?{" "}
              <Link
                href="/contact-us"
                className="underline hover:text-gray-700 transition-colors"
              >
                Reach out here
              </Link>
            </p>
          </div>
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-4xl">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-10 lg:max-w-none lg:grid-cols-2 lg:gap-y-16">
              {[
                {
                  title: "Easy Minting",
                  description:
                    "Create and mint your NFT collections on Solana with just a few clicks.",
                  icon: Wallet,
                },
                {
                  title: "NFC Integration",
                  description:
                    "Receive NFC chips linked to your digital collectibles for real-world interactions.",
                  icon: Cpu,
                },
                {
                  title: "Seamless Checkout",
                  description:
                    "Enable buyers to purchase and mint NFTs through a private, NFC-activated checkout.",
                  icon: ShoppingBag,
                },
                {
                  title: "Solana Powered",
                  description:
                    "Leverage the speed and efficiency of the Solana blockchain for your digital collectibles.",
                  icon: ChevronRight,
                },
              ].map((feature, index) => (
                <div key={index} className="relative pl-16">
                  <dt className="text-base font-semibold leading-7 text-gray-900">
                    <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-gray-900">
                      <feature.icon
                        className="h-6 w-6 text-white"
                        aria-hidden="true"
                      />
                    </div>
                    {feature.title}
                  </dt>
                  <dd className="mt-2 text-base leading-7 text-gray-600">
                    {feature.description}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        <div>
          <h1 className="mx-auto mt-24 text-4xl font-bold text-black lg:text-center">
            {brandName} Showcase
          </h1>
          <div>
            <div className="w-full max-w-[90vw] mx-auto space-y-16 py-8 relative">
              <div className="flex flex-col gap-4">
                <h1 className="text-2xl font-bold">Live</h1>
                {isLoading ? (
                  renderLoading()
                ) : (
                  <>
                    {collectibles
                      .filter((collectible) => {
                        const now = new Date().getTime();

                        if (
                          !collectible.mint_start_date &&
                          !collectible.mint_end_date
                        ) {
                          return true;
                        }

                        if (
                          collectible.mint_start_date &&
                          !collectible.mint_end_date
                        ) {
                          const startDateUTC = new Date(
                            collectible.mint_start_date
                          ).getTime();
                          if (now < startDateUTC) {
                            return false;
                          } else {
                            return true;
                          }
                        } else if (
                          collectible.mint_end_date &&
                          !collectible.mint_start_date
                        ) {
                          const endDateUTC = new Date(
                            collectible.mint_end_date
                          ).getTime();
                          if (now > endDateUTC) {
                            return false;
                          } else {
                            return true;
                          }
                        }

                        const startDate = new Date(
                          collectible.mint_start_date!
                        ).getTime();
                        const endDate = new Date(
                          collectible.mint_end_date!
                        ).getTime();
                        return startDate <= now && endDate >= now;
                      })
                      .map((collectible, index) => (
                        <CollectibleMegaCard
                          key={collectible.id}
                          collectible={collectible}
                          index={index}
                        />
                      ))}
                    {collectibles.filter((collectible) => {
                      const now = new Date().getTime();

                      if (
                        !collectible.mint_start_date &&
                        !collectible.mint_end_date
                      ) {
                        return true;
                      }

                      if (
                        collectible.mint_start_date &&
                        !collectible.mint_end_date
                      ) {
                        const startDateUTC = new Date(
                          collectible.mint_start_date
                        ).getTime();
                        if (now < startDateUTC) {
                          return false;
                        } else {
                          return true;
                        }
                      } else if (
                        collectible.mint_end_date &&
                        !collectible.mint_start_date
                      ) {
                        const endDateUTC = new Date(
                          collectible.mint_end_date
                        ).getTime();
                        if (now > endDateUTC) {
                          return false;
                        } else {
                          return true;
                        }
                      }

                      const startDate = new Date(
                        collectible.mint_start_date!
                      ).getTime();
                      const endDate = new Date(
                        collectible.mint_end_date!
                      ).getTime();
                      return startDate <= now && endDate >= now;
                    }).length === 0 && (
                      <p className="text-gray-600">
                        No live collectibles, Check back soon!
                      </p>
                    )}
                  </>
                )}
              </div>

              <div className="flex flex-col gap-4">
                <h1 className="text-2xl font-bold">Upcoming</h1>
                {isLoading ? (
                  renderLoading()
                ) : (
                  <>
                    {collectibles
                      .filter((collectible) => {
                        const now = new Date().getTime();
                        if (!collectible.mint_start_date) {
                          return false;
                        }
                        const startDate = new Date(
                          collectible.mint_start_date!
                        ).getTime();
                        return startDate > now;
                      })
                      .map((collectible, index) => (
                        <CollectibleMegaCard
                          key={collectible.id}
                          collectible={collectible}
                          index={index}
                        />
                      ))}
                    {collectibles
                      .filter((collectible) => {
                        const now = new Date().getTime();
                        if (!collectible.mint_start_date) {
                          return false;
                        }
                        const startDate = new Date(
                          collectible.mint_start_date!
                        ).getTime();
                        return startDate > now;
                      }).length === 0 && (
                      <p className="text-gray-600">
                        No upcoming collectibles, Check back soon!
                      </p>
                    )}
                  </>
                )}
              </div>

              <div className="flex flex-col gap-4">
                <h1 className="text-2xl font-bold">Ended</h1>
                {isLoading ? (
                  renderLoading()
                ) : (
                  <>
                    {collectibles
                      .filter((collectible) => {
                        const now = new Date().getTime();
                        const endDate = new Date(
                          collectible.mint_end_date!
                        ).getTime();
                        return now > endDate;
                      })
                      .map((collectible, index) => (
                        <CollectibleMegaCard
                          key={collectible.id}
                          collectible={collectible}
                          index={index}
                        />
                      ))}
                    {collectibles
                      .filter((collectible) => {
                        const now = new Date().getTime();
                        const endDate = new Date(
                          collectible.mint_end_date!
                        ).getTime();
                        return now > endDate;
                      }).length === 0 && (
                      <p className="text-gray-600">No ended collectibles</p>
                    )}
                  </>
                )}
              </div>

              <div className="flex justify-center">
                <Link href="/showcase">
                  <Button className="w-54 py-2 px-4 text-lg h-12">
                    See all collectibles →
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Hero section */}
        <div className="relative pt-14">
          <div className="py-24 sm:py-32">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
              <div className="mx-auto max-w-2xl text-center">
                <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
                  Digital Collectibles, Real-World Connections
                </h1>
                <p className="mt-6 text-lg leading-8 text-gray-600">
                  Create, mint, and share unique digital collectibles and IRLS
                  on Solana with the power of NFC technology.
                </p>
                <div className="mt-10 flex items-center justify-center gap-x-6">
                  <Link
                    href="/faq"
                    className="text-sm font-semibold leading-6 text-gray-900"
                  >
                    Learn more <span aria-hidden="true">→</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* NFC Public Key Update Button */}
        <div className="mt-10 flex items-center justify-center"></div>

        {/* How it works section */}
        <div className="mx-auto mt-32 max-w-7xl px-6 sm:mt-56 lg:px-8">
          <div className="mx-auto max-w-2xl lg:text-center">
            <h2 className="text-base font-semibold leading-7 text-gray-900">
              Simple Process
            </h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              How {brandName} Works
            </p>
          </div>
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-4xl">
            <ol className="space-y-8">
              {[
                {
                  title: "Create Your Collection",
                  description: `Log in to ${brandName} and create your unique NFT collection on the Solana blockchain.`,
                },
                {
                  title: "Receive NFC Chips",
                  description:
                    "We'll send you NFC chips linked to your digital collectibles.",
                },
                {
                  title: "Share and Sell",
                  description:
                    "Distribute your NFC chips. When tapped, they lead to a private checkout for minting.",
                },
                {
                  title: "Instant Minting",
                  description:
                    "Buyers pay and receive their newly minted NFT directly on the Solana blockchain.",
                },
              ].map((step, index) => (
                <li key={index} className="flex gap-x-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-900 text-white shrink-0">
                    {index + 1}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold leading-7 text-gray-900">
                      {step.title}
                    </h3>
                    <p className="mt-2 text-base leading-7 text-gray-600">
                      {step.description}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>

        {/* CTA section */}
        <div className="mx-auto mt-32 max-w-7xl px-6 sm:mt-56 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Ready to bring your digital collectibles to life?
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-gray-600">
              Join {brandName} today and start creating unforgettable
              experiences with your collectibles.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <a
                href="#"
                className="rounded-md bg-gray-900 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-gray-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-600"
              >
                Get started
              </a>
              <Link
                href="/faq"
                className="text-sm font-semibold leading-6 text-gray-900"
              >
                Learn more <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mx-auto mt-40 max-w-7xl overflow-hidden px-6 pb-20 sm:mt-64 sm:pb-24 lg:px-8">
        <div className="mt-8 flex justify-center space-x-6">
          <a
            href="https://x.com/streetmint_xyz?s=21&t=xZGKcmC_jMnLKtBZj0ipNA"
            className="text-gray-600 hover:text-gray-900"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span className="sr-only">X (Twitter)</span>
            <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </a>
          <a
            href="https://www.instagram.com/p/DGgJFP2trB2/?igsh=MzRlODBiNWFlZA=="
            className="text-gray-600 hover:text-gray-900"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span className="sr-only">Instagram</span>
            <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
              <path
                fillRule="evenodd"
                d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z"
                clipRule="evenodd"
              />
            </svg>
          </a>
        </div>
        <p className="mt-10 text-center text-xs leading-5 text-gray-500">
          &copy; {new Date().getFullYear()} {brandName}, Inc. All rights
          reserved.
        </p>
      </footer>
    </div>
  );
}
