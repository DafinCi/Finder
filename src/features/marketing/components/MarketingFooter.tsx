import React from "react";
import Link from "next/link";
import Image from "next/image";
import { GithubIcon } from "@/components/common/GithubIcon";

export default function MarketingFooter() {
  const stickers = [
    { type: "circle", color: "bg-voltage-violet" },
    { type: "badge", text: "GET FINDER", color: "bg-electric-blue" },
    { type: "circle", color: "bg-voltage-violet" },
    { type: "badge", text: "GET FINDER", color: "bg-ember" },
    { type: "circle", color: "bg-voltage-violet" },
    { type: "badge", text: "GET FINDER", color: "bg-sunburst" },
    { type: "circle", color: "bg-voltage-violet" },
    { type: "badge", text: "GET FINDER", color: "bg-mint-pop" },
  ];

  return (
    <footer className="w-full bg-carbon text-paper-white select-none pt-3 sm:pt-4 pb-3 sm:pb-4">
      <div className="w-full px-3 sm:px-4 space-y-3 sm:space-y-4">
        {/* ROW 1: Horizontal Sticker Tape ("GET FINDER") */}
        <div className="w-full overflow-hidden rounded-[28px] sm:rounded-[36px] bg-carbon py-1">
          <div className="animate-marquee flex items-center gap-3 sm:gap-4 whitespace-nowrap">
            {[...stickers, ...stickers].map((item, idx) => {
              if (item.type === "circle") {
                return (
                  <div
                    key={idx}
                    className="w-20 h-20 sm:w-28 sm:h-28 rounded-full bg-voltage-violet border-2 border-carbon flex items-center justify-center shrink-0 shadow-none overflow-hidden"
                  >
                    <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-paper-white border border-carbon flex items-center justify-center p-2">
                      <Image
                        src="/brand/finder-logo.png"
                        alt="Finder Logo"
                        width={40}
                        height={40}
                        className="object-contain"
                      />
                    </div>
                  </div>
                );
              }
              return (
                <div
                  key={idx}
                  className={`h-20 sm:h-28 px-6 sm:px-10 rounded-[24px] sm:rounded-[32px] ${item.color} border-2 border-carbon flex items-center justify-center shrink-0 shadow-none`}
                >
                  <div className="border-2 border-carbon rounded-[16px] sm:rounded-[20px] px-4 sm:px-6 py-1 bg-transparent">
                    <span className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tighter text-carbon uppercase font-sans leading-none">
                      {item.text}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ROW 2: Bento Grid (2x2 Social Icons on Left + Mint Pop Card on Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 items-stretch">
          {/* Left Column: 2x2 Square White Icon Buttons */}
          <div className="lg:col-span-4 grid grid-cols-2 gap-3 sm:gap-4">
            {/* 1. GitHub Card */}
            <a
              href="https://github.com/DafinCi/Finder"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Finder on GitHub"
              className="rounded-[24px] sm:rounded-[32px] bg-paper-white border border-carbon flex items-center justify-center aspect-square p-4 sm:p-6 hover:bg-soft-mist transition-colors group cursor-pointer"
            >
              <GithubIcon className="w-10 h-10 sm:w-14 sm:h-14 text-carbon group-hover:scale-105 transition-transform" />
            </a>

            {/* 2. X (Twitter) Card */}
            <a
              href="https://x.com/elfarizi_"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Finder creator on X (Twitter)"
              className="rounded-[24px] sm:rounded-[32px] bg-paper-white border border-carbon flex items-center justify-center aspect-square p-4 sm:p-6 hover:bg-soft-mist transition-colors group cursor-pointer"
            >
              <svg
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-9 h-9 sm:w-12 sm:h-12 text-carbon group-hover:scale-105 transition-transform"
              >
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>

            {/* 3. Sui Network Card */}
            <a
              href="https://sui.io"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Sui Network Ecosystem"
              className="rounded-[24px] sm:rounded-[32px] bg-paper-white border border-carbon flex items-center justify-center aspect-square p-4 sm:p-6 hover:bg-soft-mist transition-colors group cursor-pointer"
            >
              <svg
                viewBox="0 0 100 100"
                fill="currentColor"
                className="w-10 h-10 sm:w-14 sm:h-14 text-carbon group-hover:scale-105 transition-transform"
              >
                <path d="M50 10C44 20 22 54 22 69a28 28 0 0 0 56 0c0-15-22-49-28-59zm0 18c4.5 8 16 28 17 41a17 17 0 0 1-34 0c1-13 12.5-33 17-41z" />
              </svg>
            </a>

            {/* 4. Groq Card */}
            <a
              href="https://groq.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Powered by Groq"
              className="rounded-[24px] sm:rounded-[32px] bg-paper-white border border-carbon flex items-center justify-center aspect-square p-4 sm:p-6 hover:bg-soft-mist transition-colors group cursor-pointer"
            >
              <img
                src="https://console.groq.com/powered-by-groq-dark.svg"
                alt="Powered by Groq"
                className="h-8 sm:h-10 object-contain group-hover:scale-105 transition-transform"
              />
            </a>
          </div>

          {/* Right Column: Giant Mint Pop (#55db9c) Card */}
          <div className="lg:col-span-8 rounded-[32px] sm:rounded-[44px] bg-mint-pop border border-carbon p-6 sm:p-10 lg:p-12 text-carbon flex flex-col justify-between">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-8">
              {/* Left Side: Bold Display Statement */}
              <div className="space-y-4 max-w-md">
                <h3 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tighter uppercase leading-[0.88] text-carbon">
                  START WITH FINDER.
                  <br />
                  <span className="italic block mt-1">
                    THEN MAKE IT ALL HAPPEN.
                  </span>
                </h3>
              </div>

              {/* Right Side: Navigation Links (Slush Style) */}
              <div className="flex flex-col items-start md:items-end space-y-6">
                <nav
                  aria-label="Footer Primary Navigation"
                  className="flex flex-col space-y-1.5 sm:space-y-2 text-left md:text-right text-sm sm:text-base font-extrabold tracking-tight text-carbon uppercase"
                >
                  <Link
                    href="/c"
                    className="hover:opacity-70 transition-opacity"
                  >
                    WORKSPACE
                  </Link>
                  <Link
                    href="/jobs"
                    className="hover:opacity-70 transition-opacity"
                  >
                    ACTIVE JOBS
                  </Link>
                  <Link
                    href="/c"
                    className="hover:opacity-70 transition-opacity"
                  >
                    COPILOT
                  </Link>
                  <Link
                    href="/register"
                    className="hover:opacity-70 transition-opacity"
                  >
                    GET STARTED
                  </Link>
                  <a
                    href="https://github.com/DafinCi/Finder/tree/develop/docs"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:opacity-70 transition-opacity"
                  >
                    ARCHITECTURE
                  </a>
                  <a
                    href="https://github.com/DafinCi/Finder/blob/develop/docs/integrations/walrus-memwal.md"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:opacity-70 transition-opacity"
                  >
                    WALRUS MEMORY
                  </a>
                  <a
                    href="https://github.com/DafinCi/Finder"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:opacity-70 transition-opacity"
                  >
                    GITHUB
                  </a>
                </nav>

                {/* Sub-links (Fine Print) */}
                <nav
                  aria-label="Footer Legal and Specs"
                  className="flex flex-col space-y-1 text-left md:text-right text-[11px] font-bold uppercase tracking-wider text-carbon/75"
                >
                  <a
                    href="#preview"
                    className="hover:text-carbon transition-colors"
                  >
                    FAQ
                  </a>
                  <a
                    href="https://github.com/DafinCi/Finder/blob/develop/docs/architecture/system-architecture.md"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-carbon transition-colors"
                  >
                    SPECIFICATIONS
                  </a>
                  <a
                    href="https://github.com/DafinCi/Finder/blob/develop/SECURITY.md"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-carbon transition-colors"
                  >
                    PRIVACY NOTICE
                  </a>
                  <a
                    href="https://github.com/DafinCi/Finder/blob/develop/LICENSE"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-carbon transition-colors"
                  >
                    TERMS OF SERVICE
                  </a>
                </nav>
              </div>
            </div>

            {/* Bottom Row inside Mint Card */}
            <div className="pt-8 sm:pt-12 border-t border-carbon/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs font-bold uppercase tracking-wider text-carbon/80">
              <p>© 2026 FINDER. MIT LICENSE.</p>
              <p className="text-[11px] font-semibold lowercase tracking-normal">
                groq qwen3.8-27b • walrus mainnet • sui siws
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
