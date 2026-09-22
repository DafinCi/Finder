import React from "react";
import { Share2, MapPin, Briefcase } from "lucide-react";

interface ProfileHeroProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  userData?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  analysis?: any;
}

export default function ProfileHero({ userData, analysis }: ProfileHeroProps) {
  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      alert("Link portofolio berhasil disalin ke papan klip!");
    }
  };

  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-2">
      <div className="flex items-center gap-5">
        <div className="w-20 h-20 rounded-[6px] bg-secondary border border-border flex items-center justify-center text-[28px] font-heading font-bold text-primary shrink-0">
          {userData?.name ? userData.name.charAt(0).toUpperCase() : "P"}
        </div>

        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-[36px] font-heading font-semibold text-foreground tracking-tight leading-none">
              {userData?.name || "Anonymous Professional"}
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[6px] text-[12px] font-sans font-medium bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Open to Work
            </span>
          </div>

          <p className="text-[20px] font-sans text-muted-foreground leading-none">
            {analysis?.title || "Tech Specialist"}
          </p>

          <div className="flex flex-wrap gap-4 pt-1 text-[14px] font-sans text-muted-foreground/80">
            <span className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-muted-foreground/50" />
              {userData?.location || "Indonesia (Remote)"}
            </span>
            <span className="flex items-center gap-1.5">
              <Briefcase className="w-4 h-4 text-muted-foreground/50" />
              {analysis?.years_of_experience || 0} Years Exp
            </span>
          </div>
        </div>
      </div>

      <div className="flex gap-3 w-full md:w-auto">
        <button
          onClick={handleShare}
          className="flex-1 md:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 border border-border bg-secondary/30 text-foreground font-sans font-medium text-[14px] rounded-[6px] transition-all duration-150 hover:bg-secondary/60 active:scale-[0.98] cursor-pointer"
        >
          <Share2 className="w-4 h-4" />
          Share Identity
        </button>
      </div>
    </div>
  );
}
