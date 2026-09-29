// ==============================================================================
// DIALOG: EditPreferencesDialog
// Module: @/features/profile/components/dialogs/EditPreferencesDialog
// ==============================================================================

"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  X,
  SlidersHorizontal,
  MapPin,
  Banknote,
  Sparkles,
  ShieldAlert,
  Plus,
  Check,
  Loader2,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Preferences,
  HardConstraints,
  WorkMode,
  NegativePreferenceItem,
} from "../../types/career-profile.types";
import {
  WORK_MODE_OPTIONS,
  PRESET_LOCATIONS,
  PRESET_PRIORITIES,
  PRESET_NEGATIVE_PREFERENCES,
  NEGATIVE_PREFERENCE_LABELS,
} from "@/features/onboarding/types/onboarding.types";
import { toast } from "sonner";

interface EditPreferencesDialogProps {
  isOpen: boolean;
  onClose: () => void;
  preferences: Preferences | undefined;
  constraints: HardConstraints | undefined;
  onSave: (
    preferences: Preferences,
    constraints?: HardConstraints,
  ) => Promise<boolean>;
}

export function EditPreferencesDialog({
  isOpen,
  onClose,
  preferences,
  constraints,
  onSave,
}: EditPreferencesDialogProps) {
  const [workModes, setWorkModes] = useState<WorkMode[]>(["remote"]);
  const [workModeStrict, setWorkModeStrict] = useState(false);
  const [locations, setLocations] = useState<string[]>([]);
  const [newLocationInput, setNewLocationInput] = useState("");
  const [relocationProhibited, setRelocationProhibited] = useState(false);

  // Salary state
  const [salaryNotSpecified, setSalaryNotSpecified] = useState(true);
  const [salaryMin, setSalaryMin] = useState<number | null>(null);
  const [salaryCurrency, setSalaryCurrency] = useState("USD");

  // Priorities and Negative Preferences
  const [priorities, setPriorities] = useState<string[]>([]);
  const [negativePreferences, setNegativePreferences] = useState<
    NegativePreferenceItem[]
  >([]);
  const [customNegativeToken, setCustomNegativeToken] = useState("");

  const [isSaving, setIsSaving] = useState(false);
  const modalRef = useRef<HTMLDivElement | null>(null);

  // Sync state on open
  useEffect(() => {
    if (isOpen) {
      setWorkModes(
        preferences?.work_modes && preferences.work_modes.length > 0
          ? preferences.work_modes
          : ["remote"],
      );
      setWorkModeStrict(Boolean(constraints?.work_mode_strict));
      setLocations(preferences?.locations || []);
      setRelocationProhibited(Boolean(constraints?.relocation_prohibited));

      if (preferences?.salary && preferences.salary.min_amount) {
        setSalaryNotSpecified(false);
        setSalaryMin(preferences.salary.min_amount);
        setSalaryCurrency(preferences.salary.currency || "USD");
      } else {
        setSalaryNotSpecified(true);
        setSalaryMin(null);
        setSalaryCurrency(preferences?.salary?.currency || "USD");
      }

      setPriorities(preferences?.priorities || []);
      setNegativePreferences(preferences?.negative_preferences || []);
      setNewLocationInput("");
      setCustomNegativeToken("");
    }
  }, [isOpen, preferences, constraints]);

  // Handle ESC key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isSaving) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isSaving, onClose]);

  if (!isOpen) return null;

  const handleToggleWorkMode = (wm: WorkMode) => {
    setWorkModes((prev) => {
      if (prev.includes(wm)) {
        if (prev.length === 1) {
          toast.warning("Minimal pilih 1 work mode.");
          return prev;
        }
        return prev.filter((m) => m !== wm);
      }
      return [...prev, wm];
    });
  };

  const handleAddLocation = (loc: string) => {
    const trimmed = loc.trim();
    if (!trimmed) return;
    if (locations.some((l) => l.toLowerCase() === trimmed.toLowerCase())) {
      toast.warning("Lokasi ini sudah ada.");
      return;
    }
    setLocations((prev) => [...prev, trimmed]);
    setNewLocationInput("");
  };

  const handleRemoveLocation = (loc: string) => {
    setLocations((prev) => prev.filter((l) => l !== loc));
  };

  const handleTogglePriority = (id: string) => {
    setPriorities((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
    );
  };

  const handleToggleNegativePreset = (item: NegativePreferenceItem) => {
    setNegativePreferences((prev) => {
      const exists = prev.some((p) => p.token === item.token);
      if (exists) {
        return prev.filter((p) => p.token !== item.token);
      }
      return [...prev, item];
    });
  };

  const handleAddCustomNegative = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customNegativeToken.trim().toLowerCase();
    if (!trimmed) return;
    if (negativePreferences.some((p) => p.token === trimmed)) {
      toast.warning("Kriteria negatif ini sudah terdaftar.");
      return;
    }
    setNegativePreferences((prev) => [
      ...prev,
      { domain: "work_style", token: trimmed, penalty_weight: 1.0 },
    ]);
    setCustomNegativeToken("");
  };

  const handleRemoveNegative = (token: string) => {
    setNegativePreferences((prev) => prev.filter((p) => p.token !== token));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (workModes.length === 0) {
      toast.error("Minimal harus memilih 1 work mode.");
      return;
    }

    const payloadPreferences: Preferences = {
      work_modes: workModes,
      locations,
      priorities,
      salary:
        salaryNotSpecified || !salaryMin
          ? null
          : { min_amount: Number(salaryMin), currency: salaryCurrency },
      negative_preferences: negativePreferences,
    };

    const payloadConstraints: HardConstraints = {
      work_mode_strict: workModeStrict,
      relocation_prohibited: relocationProhibited,
    };

    setIsSaving(true);
    try {
      const ok = await onSave(payloadPreferences, payloadConstraints);
      if (ok) {
        onClose();
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="preferences-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        ref={modalRef}
        className="w-full max-w-xl bg-card border border-border rounded-xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border/80 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-primary/10 text-primary border border-primary/20">
              <SlidersHorizontal className="w-4 h-4" />
            </div>
            <div>
              <h2
                id="preferences-dialog-title"
                className="text-sm font-bold font-heading text-foreground"
              >
                Edit Preferences & Constraints
              </h2>
              <p className="text-[11px] text-muted-foreground">
                Pengaturan filter ketat (Stage 1) dan preferensi kerja (Stage 2)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form
          id="preferences-form"
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar"
        >
          {/* Section 1: Work Mode & Strictness */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-foreground block">
              Work Mode (Pilih minimal 1)
            </label>

            <div className="grid grid-cols-3 gap-2">
              {WORK_MODE_OPTIONS.map((opt) => {
                const isSelected = workModes.includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleToggleWorkMode(opt.value)}
                    className={`p-2.5 rounded-lg border text-center transition-colors cursor-pointer ${
                      isSelected
                        ? "bg-primary text-primary-foreground border-primary font-bold"
                        : "bg-secondary/40 text-muted-foreground border-border hover:bg-secondary"
                    }`}
                  >
                    <span className="text-xs">{opt.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Strictness Switch */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border">
              <div className="space-y-0.5">
                <span className="text-xs font-semibold text-foreground block">
                  Stage 1 Hard Constraint (Ketat)
                </span>
                <p className="text-[11px] text-muted-foreground">
                  Jika aktif, lowongan yang tidak sesuai mode kerja akan
                  langsung dibuang di Stage 1 constraint filter.
                </p>
              </div>

              <input
                type="checkbox"
                checked={workModeStrict}
                onChange={(e) => setWorkModeStrict(e.target.checked)}
                className="w-4 h-4 accent-primary cursor-pointer"
              />
            </div>
          </div>

          {/* Section 2: Locations & Relocation */}
          <div className="space-y-3 pt-2 border-t border-border/60">
            <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-primary" />
              Preferred Locations
            </label>

            <div className="flex flex-wrap gap-1.5">
              {PRESET_LOCATIONS.map((loc) => {
                const isSelected = locations.includes(loc);
                return (
                  <button
                    key={`loc-preset-${loc}`}
                    type="button"
                    onClick={() =>
                      isSelected
                        ? handleRemoveLocation(loc)
                        : handleAddLocation(loc)
                    }
                    className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors cursor-pointer ${
                      isSelected
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-secondary/40 text-muted-foreground border-border hover:bg-secondary"
                    }`}
                  >
                    {loc}
                  </button>
                );
              })}
            </div>

            {/* Custom Location Input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newLocationInput}
                onChange={(e) => setNewLocationInput(e.target.value)}
                placeholder="+ Tambah lokasi kustom..."
                className="flex-1 bg-secondary/30 border border-border rounded-md px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => handleAddLocation(newLocationInput)}
                disabled={!newLocationInput.trim()}
                className="text-xs h-8"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah</span>
              </Button>
            </div>

            {/* Relocation Switch */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border">
              <div className="space-y-0.5">
                <span className="text-xs font-semibold text-foreground block">
                  Larang Relokasi (Strict Relocation Prohibition)
                </span>
                <p className="text-[11px] text-muted-foreground">
                  Hanya terima lowongan lokal atau remote. Tolak tawaran yang
                  mewajibkan pindah kota/negara.
                </p>
              </div>

              <input
                type="checkbox"
                checked={relocationProhibited}
                onChange={(e) => setRelocationProhibited(e.target.checked)}
                className="w-4 h-4 accent-primary cursor-pointer"
              />
            </div>
          </div>

          {/* Section 3: Salary Expectation */}
          <div className="space-y-3 pt-2 border-t border-border/60">
            <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <Banknote className="w-3.5 h-3.5 text-primary" />
              Salary Expectation
            </label>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="salary-not-specified"
                checked={salaryNotSpecified}
                onChange={(e) => setSalaryNotSpecified(e.target.checked)}
                className="w-4 h-4 accent-primary cursor-pointer"
              />
              <label
                htmlFor="salary-not-specified"
                className="text-xs text-foreground font-medium cursor-pointer"
              >
                Not specified (Fleksibel / Netral — Jangan membatasi matching)
              </label>
            </div>

            {!salaryNotSpecified && (
              <div className="flex gap-2 animate-in fade-in duration-150">
                <select
                  value={salaryCurrency}
                  onChange={(e) => setSalaryCurrency(e.target.value)}
                  className="w-24 bg-card border border-border rounded-md px-2 py-1.5 text-xs text-foreground focus:outline-none"
                >
                  <option value="USD">USD ($)</option>
                  <option value="IDR">IDR (Rp)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="SGD">SGD (S$)</option>
                </select>

                <input
                  type="number"
                  value={salaryMin || ""}
                  onChange={(e) =>
                    setSalaryMin(e.target.value ? Number(e.target.value) : null)
                  }
                  placeholder="Jumlah minimum bulanan..."
                  className="flex-1 bg-secondary/30 border border-border rounded-md px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none"
                />
              </div>
            )}
          </div>

          {/* Section 4: Priorities */}
          <div className="space-y-2 pt-2 border-t border-border/60">
            <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              Prioritas Nilai Karir
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PRESET_PRIORITIES.map((p) => {
                const isSelected = priorities.includes(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleTogglePriority(p.id)}
                    className={`p-2 rounded-lg border text-left transition-colors cursor-pointer ${
                      isSelected
                        ? "bg-primary/10 border-primary text-foreground"
                        : "bg-secondary/40 border-border text-muted-foreground hover:bg-secondary"
                    }`}
                  >
                    <span className="text-xs font-bold block flex items-center justify-between">
                      <span>{p.label}</span>
                      {isSelected && <Check className="w-3 h-3 text-primary" />}
                    </span>
                    <span className="text-[10px] text-muted-foreground line-clamp-1">
                      {p.description}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 5: Negative Preferences */}
          <div className="space-y-2 pt-2 border-t border-border/60">
            <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-destructive" />
              Negative Preferences (Anti-Matches)
            </label>
            <p className="text-[11px] text-muted-foreground">
              Finder akan mengurangi skor rekomendasi dengan rumus diminishing
              penalty (P_neg) untuk lowongan yang mengandung kriteria ini.
            </p>

            <div className="flex flex-wrap gap-1.5">
              {PRESET_NEGATIVE_PREFERENCES.map((neg) => {
                const isSelected = negativePreferences.some(
                  (p) => p.token === neg.token,
                );
                return (
                  <button
                    key={`neg-${neg.token}`}
                    type="button"
                    onClick={() => handleToggleNegativePreset(neg)}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors cursor-pointer ${
                      isSelected
                        ? "bg-destructive/15 text-destructive border-destructive/30 font-bold"
                        : "bg-secondary/40 text-muted-foreground border-border hover:bg-secondary"
                    }`}
                  >
                    {NEGATIVE_PREFERENCE_LABELS[neg.token] || neg.token}
                  </button>
                );
              })}
            </div>

            {/* Custom Negative Tag Input */}
            <div className="flex gap-2 pt-1">
              <input
                type="text"
                value={customNegativeToken}
                onChange={(e) => setCustomNegativeToken(e.target.value)}
                placeholder="+ Tambah anti-match kustom (contoh: legacy-php, crypto)..."
                className="flex-1 bg-secondary/30 border border-border rounded-md px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleAddCustomNegative}
                disabled={!customNegativeToken.trim()}
                className="text-xs h-8"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah</span>
              </Button>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2.5 p-4 border-t border-border/80 bg-card shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isSaving}
            className="text-xs"
          >
            Batal
          </Button>

          <Button
            type="submit"
            form="preferences-form"
            size="sm"
            disabled={isSaving}
            className="text-xs gap-1.5"
          >
            {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>Simpan Perubahan</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
