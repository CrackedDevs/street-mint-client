"use client";

import { useState } from "react";
import { sendEmail } from "./action";
import Image from "next/image";

export default function ContactForm() {
  const [status, setStatus] = useState<{
    success?: boolean;
    message?: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [body, setBody] = useState("");

  const isIrlsDomain =
    typeof window !== "undefined" &&
    window.location.hostname === "www.irls.xyz";
  console.log(
    "isIrlsDomain",
    typeof window !== "undefined" && window.location.hostname
  );
  const BRAND_NAME = isIrlsDomain ? "IRLS" : "Street Mint";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      const result = await sendEmail(name, email, body);
      setStatus(result);
      if (result.success) {
        setName("");
        setEmail("");
        setBody("");
      }
    } catch (error) {
      setStatus({ success: false, message: "An error occurred" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <header className="absolute inset-x-0 top-0 z-50">
        <nav className="flex justify-center p-6 lg:px-8" aria-label="Global">
          <a href="#" className="-m-1.5 p-1.5">
            <span className="sr-only">{BRAND_NAME}</span>
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

      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="max-w-md w-full space-y-8">
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Contact Us
          </h2>
          <form
            id="contact-form"
            className="mt-8 space-y-6"
            onSubmit={handleSubmit}
          >
            <div className="rounded-md shadow-sm space-y-4">
              <div>
                <label htmlFor="name" className="sr-only">
                  Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="appearance-none rounded-md relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-black focus:border-black focus:z-10 text-base"
                  placeholder="Name"
                />
              </div>
              <div>
                <label htmlFor="email" className="sr-only">
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none rounded-md relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-black focus:border-black focus:z-10 text-base"
                  placeholder="Email address"
                />
              </div>
              <div>
                <label htmlFor="body" className="sr-only">
                  Message
                </label>
                <textarea
                  id="body"
                  name="body"
                  required
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="appearance-none rounded-md relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-black focus:border-black focus:z-10 text-base"
                  placeholder="Your message"
                  rows={4}
                ></textarea>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-md font-medium rounded-md text-white bg-black hover:bg-gray-800 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Sending..." : "Submit"}
              </button>
            </div>
          </form>
          {status && (
            <div
              className={`mt-4 text-center text-lg font-medium ${
                status.success ? "text-green-600" : "text-red-600"
              }`}
            >
              {status.message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
