import React from "react";

export default function MarqueeBanner() {
  const tickerText =
    "POWERED BY GROQ FAST INFERENCE • DECENTRALIZED MEMORY ON WALRUS MAINNET • DETERMINISTIC TWO-STAGE MATCHING • PRIVACY-FIRST RESUME INTELLIGENCE • SIGN IN WITH SUI (SIWS) • 100% OPEN SOURCE (MIT) • ";

  return (
    <div
      role="region"
      aria-label="Announcement banner"
      className="w-full bg-lavender text-carbon border-b border-carbon overflow-hidden select-none py-1.5"
    >
      <div className="animate-marquee whitespace-nowrap text-[12px] sm:text-[13px] font-bold tracking-[0.032em] uppercase font-sans">
        <span className="inline-block px-4">{tickerText}</span>
        <span className="inline-block px-4">{tickerText}</span>
        <span className="inline-block px-4">{tickerText}</span>
        <span className="inline-block px-4">{tickerText}</span>
      </div>
    </div>
  );
}
