// ==============================================================================
// DIALOG: EditBackgroundDialog
// Module: @/features/profile/components/dialogs/EditBackgroundDialog
// ==============================================================================

"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  X,
  GraduationCap,
  Building2,
  FolderGit2,
  Plus,
  Trash2,
  Loader2,
  Calendar,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  BackgroundEvidence,
  EducationEvidence,
  WorkExperienceEvidence,
  ProjectEvidence,
} from "../../types/career-profile.types";
import { toast } from "sonner";

interface EditBackgroundDialogProps {
  isOpen: boolean;
  onClose: () => void;
  background: BackgroundEvidence | undefined;
  onSave: (background: BackgroundEvidence) => Promise<boolean>;
}

export function EditBackgroundDialog({
  isOpen,
  onClose,
  background,
  onSave,
}: EditBackgroundDialogProps) {
  const [activeTab, setActiveTab] = useState<
    "experience" | "education" | "projects"
  >("experience");

  const [experienceList, setExperienceList] = useState<
    WorkExperienceEvidence[]
  >([]);
  const [educationList, setEducationList] = useState<EducationEvidence[]>([]);
  const [projectList, setProjectList] = useState<ProjectEvidence[]>([]);

  // Experience form state
  const [expCompany, setExpCompany] = useState("");
  const [expRole, setExpRole] = useState("");
  const [expStartDate, setExpStartDate] = useState("");
  const [expEndDate, setExpEndDate] = useState("");
  const [expIsCurrent, setExpIsCurrent] = useState(false);
  const [expSummary, setExpSummary] = useState("");
  const [expTech, setExpTech] = useState("");

  // Education form state
  const [eduInstitution, setEduInstitution] = useState("");
  const [eduDegree, setEduDegree] = useState("");
  const [eduField, setEduField] = useState("");
  const [eduYear, setEduYear] = useState<string>("");

  // Project form state
  const [projTitle, setProjTitle] = useState("");
  const [projDesc, setProjDesc] = useState("");
  const [projTech, setProjTech] = useState("");
  const [projUrl, setProjUrl] = useState("");

  const [isSaving, setIsSaving] = useState(false);
  const modalRef = useRef<HTMLDivElement | null>(null);

  // Sync state on open
  useEffect(() => {
    if (isOpen) {
      setExperienceList(background?.experience || []);
      setEducationList(background?.education || []);
      setProjectList(background?.projects || []);

      // Reset sub-forms
      setExpCompany("");
      setExpRole("");
      setExpStartDate("");
      setExpEndDate("");
      setExpIsCurrent(false);
      setExpSummary("");
      setExpTech("");

      setEduInstitution("");
      setEduDegree("");
      setEduField("");
      setEduYear("");

      setProjTitle("");
      setProjDesc("");
      setProjTech("");
      setProjUrl("");
    }
  }, [isOpen, background]);

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

  // Add Experience
  const handleAddExperience = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expCompany.trim() || !expRole.trim()) {
      toast.warning("Nama perusahaan dan role/jabatan wajib diisi.");
      return;
    }

    const newExp: WorkExperienceEvidence = {
      id: `exp-${Date.now()}`,
      company_name: expCompany.trim(),
      role_title: expRole.trim(),
      start_date: expStartDate.trim() || null,
      end_date: expIsCurrent ? null : expEndDate.trim() || null,
      is_current: expIsCurrent,
      description_summary: expSummary.trim(),
      technologies_used: expTech
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      provenance: {
        source: "user_explicit",
        confidence: 1.0,
        updated_at: new Date().toISOString(),
      },
    };

    setExperienceList((prev) => [newExp, ...prev]);
    setExpCompany("");
    setExpRole("");
    setExpStartDate("");
    setExpEndDate("");
    setExpIsCurrent(false);
    setExpSummary("");
    setExpTech("");
    toast.success("Pengalaman kerja ditambahkan ke daftar.");
  };

  const handleRemoveExperience = (id: string) => {
    setExperienceList((prev) => prev.filter((item) => item.id !== id));
  };

  // Add Education
  const handleAddEducation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eduInstitution.trim()) {
      toast.warning("Nama institusi wajib diisi.");
      return;
    }

    const newEdu: EducationEvidence = {
      id: `edu-${Date.now()}`,
      institution: eduInstitution.trim(),
      degree: eduDegree.trim(),
      field_of_study: eduField.trim(),
      graduation_year: eduYear ? Number(eduYear) : null,
      provenance: {
        source: "user_explicit",
        confidence: 1.0,
        updated_at: new Date().toISOString(),
      },
    };

    setEducationList((prev) => [newEdu, ...prev]);
    setEduInstitution("");
    setEduDegree("");
    setEduField("");
    setEduYear("");
    toast.success("Riwayat pendidikan ditambahkan.");
  };

  const handleRemoveEducation = (id: string) => {
    setEducationList((prev) => prev.filter((item) => item.id !== id));
  };

  // Add Project
  const handleAddProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projTitle.trim()) {
      toast.warning("Judul proyek wajib diisi.");
      return;
    }

    const newProj: ProjectEvidence = {
      id: `proj-${Date.now()}`,
      title: projTitle.trim(),
      description: projDesc.trim(),
      technologies_used: projTech
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      url: projUrl.trim() || undefined,
      provenance: {
        source: "user_explicit",
        confidence: 1.0,
        updated_at: new Date().toISOString(),
      },
    };

    setProjectList((prev) => [newProj, ...prev]);
    setProjTitle("");
    setProjDesc("");
    setProjTech("");
    setProjUrl("");
    toast.success("Proyek ditambahkan.");
  };

  const handleRemoveProject = (id: string) => {
    setProjectList((prev) => prev.filter((item) => item.id !== id));
  };

  // Submit all background changes
  const handleSubmit = async () => {
    setIsSaving(true);
    try {
      const ok = await onSave({
        education: educationList,
        experience: experienceList,
        projects: projectList,
      });

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
      aria-labelledby="background-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        ref={modalRef}
        className="w-full max-w-2xl bg-card border border-border rounded-xl shadow-2xl flex flex-col h-[85vh] overflow-hidden animate-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border/80 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-primary/10 text-primary border border-primary/20">
              <GraduationCap className="w-4 h-4" />
            </div>
            <div>
              <h2
                id="background-dialog-title"
                className="text-sm font-bold font-heading text-foreground"
              >
                Edit Career Background & Evidence
              </h2>
              <p className="text-[11px] text-muted-foreground">
                Pengalaman kerja, riwayat pendidikan, dan portofolio proyek
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

        {/* Tab Selector */}
        <div className="flex border-b border-border/70 px-5 bg-secondary/15 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab("experience")}
            className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === "experience"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Pengalaman ({experienceList.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("education")}
            className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === "education"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Pendidikan ({educationList.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("projects")}
            className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === "projects"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <FolderGit2 className="w-3.5 h-3.5" />
            <span>Proyek ({projectList.length})</span>
          </button>
        </div>

        {/* Scrollable Tab Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar">
          {/* TAB 1: WORK EXPERIENCE */}
          {activeTab === "experience" && (
            <div className="space-y-6">
              {/* Form Tambah Pengalaman */}
              <form
                onSubmit={handleAddExperience}
                className="p-4 rounded-xl bg-secondary/20 border border-border/80 space-y-3"
              >
                <h3 className="text-xs font-bold text-foreground flex items-center gap-1">
                  <Plus className="w-3.5 h-3.5 text-primary" />
                  Tambah Pengalaman Kerja Baru
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={expCompany}
                    onChange={(e) => setExpCompany(e.target.value)}
                    placeholder="Nama Perusahaan *"
                    className="bg-card border border-border rounded-md px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none"
                  />
                  <input
                    type="text"
                    value={expRole}
                    onChange={(e) => setExpRole(e.target.value)}
                    placeholder="Role / Jabatan *"
                    className="bg-card border border-border rounded-md px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={expStartDate}
                    onChange={(e) => setExpStartDate(e.target.value)}
                    placeholder="Tanggal Mulai (e.g. Jan 2023)"
                    className="bg-card border border-border rounded-md px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none"
                  />
                  <input
                    type="text"
                    value={expEndDate}
                    onChange={(e) => setExpEndDate(e.target.value)}
                    disabled={expIsCurrent}
                    placeholder={
                      expIsCurrent
                        ? "Sekarang"
                        : "Tanggal Selesai (e.g. Des 2024)"
                    }
                    className="bg-card border border-border rounded-md px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none disabled:opacity-50"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="exp-is-current"
                    checked={expIsCurrent}
                    onChange={(e) => setExpIsCurrent(e.target.checked)}
                    className="w-3.5 h-3.5 accent-primary cursor-pointer"
                  />
                  <label
                    htmlFor="exp-is-current"
                    className="text-xs text-muted-foreground cursor-pointer"
                  >
                    Saya saat ini masih bekerja di sini
                  </label>
                </div>

                <textarea
                  value={expSummary}
                  onChange={(e) => setExpSummary(e.target.value)}
                  placeholder="Ringkasan tanggung jawab & pencapaian utama..."
                  rows={2}
                  className="w-full bg-card border border-border rounded-md px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none resize-none"
                />

                <input
                  type="text"
                  value={expTech}
                  onChange={(e) => setExpTech(e.target.value)}
                  placeholder="Teknologi yang digunakan (pisahkan dengan koma: React, TypeScript, Docker)..."
                  className="w-full bg-card border border-border rounded-md px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none"
                />

                <Button type="submit" size="sm" className="text-xs gap-1">
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambahkan Pengalaman</span>
                </Button>
              </form>

              {/* Daftar Pengalaman Tersimpan */}
              <div className="space-y-3">
                <span className="text-xs font-bold text-foreground block">
                  Daftar Pengalaman Tersimpan
                </span>

                {experienceList.length > 0 ? (
                  experienceList.map((exp) => (
                    <div
                      key={exp.id}
                      className="p-3.5 rounded-lg border border-border bg-card/60 flex items-start justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <h4 className="text-xs font-bold text-foreground">
                          {exp.role_title} •{" "}
                          <span className="text-primary">
                            {exp.company_name}
                          </span>
                        </h4>
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {exp.start_date || "N/A"} -{" "}
                          {exp.is_current ? "Sekarang" : exp.end_date || "N/A"}
                        </span>
                        {exp.description_summary && (
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {exp.description_summary}
                          </p>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveExperience(exp.id)}
                        className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                        title="Hapus pengalaman ini"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground italic">
                    Belum ada pengalaman kerja terdaftar.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: EDUCATION */}
          {activeTab === "education" && (
            <div className="space-y-6">
              {/* Form Tambah Pendidikan */}
              <form
                onSubmit={handleAddEducation}
                className="p-4 rounded-xl bg-secondary/20 border border-border/80 space-y-3"
              >
                <h3 className="text-xs font-bold text-foreground flex items-center gap-1">
                  <Plus className="w-3.5 h-3.5 text-primary" />
                  Tambah Riwayat Pendidikan Baru
                </h3>

                <input
                  type="text"
                  value={eduInstitution}
                  onChange={(e) => setEduInstitution(e.target.value)}
                  placeholder="Nama Institusi / Universitas *"
                  className="w-full bg-card border border-border rounded-md px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none"
                />

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input
                    type="text"
                    value={eduDegree}
                    onChange={(e) => setEduDegree(e.target.value)}
                    placeholder="Gelar (e.g. S1 / Bachelor)"
                    className="bg-card border border-border rounded-md px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none"
                  />
                  <input
                    type="text"
                    value={eduField}
                    onChange={(e) => setEduField(e.target.value)}
                    placeholder="Jurusan / Bidang Studi"
                    className="bg-card border border-border rounded-md px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none"
                  />
                  <input
                    type="number"
                    value={eduYear}
                    onChange={(e) => setEduYear(e.target.value)}
                    placeholder="Tahun Lulus (e.g. 2024)"
                    className="bg-card border border-border rounded-md px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none"
                  />
                </div>

                <Button type="submit" size="sm" className="text-xs gap-1">
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambahkan Pendidikan</span>
                </Button>
              </form>

              {/* Daftar Pendidikan Tersimpan */}
              <div className="space-y-3">
                <span className="text-xs font-bold text-foreground block">
                  Daftar Pendidikan Tersimpan
                </span>

                {educationList.length > 0 ? (
                  educationList.map((edu) => (
                    <div
                      key={edu.id}
                      className="p-3.5 rounded-lg border border-border bg-card/60 flex items-start justify-between gap-3"
                    >
                      <div className="space-y-0.5">
                        <h4 className="text-xs font-bold text-foreground">
                          {edu.institution}
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          {edu.degree}{" "}
                          {edu.field_of_study ? `• ${edu.field_of_study}` : ""}
                        </p>
                        {edu.graduation_year && (
                          <span className="text-[10px] text-primary font-mono block">
                            Lulus: {edu.graduation_year}
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveEducation(edu.id)}
                        className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                        title="Hapus pendidikan ini"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground italic">
                    Belum ada riwayat pendidikan terdaftar.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: PROJECTS */}
          {activeTab === "projects" && (
            <div className="space-y-6">
              {/* Form Tambah Proyek */}
              <form
                onSubmit={handleAddProject}
                className="p-4 rounded-xl bg-secondary/20 border border-border/80 space-y-3"
              >
                <h3 className="text-xs font-bold text-foreground flex items-center gap-1">
                  <Plus className="w-3.5 h-3.5 text-primary" />
                  Tambah Proyek Baru
                </h3>

                <input
                  type="text"
                  value={projTitle}
                  onChange={(e) => setProjTitle(e.target.value)}
                  placeholder="Judul Proyek *"
                  className="w-full bg-card border border-border rounded-md px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none"
                />

                <textarea
                  value={projDesc}
                  onChange={(e) => setProjDesc(e.target.value)}
                  placeholder="Deskripsi singkat proyek..."
                  rows={2}
                  className="w-full bg-card border border-border rounded-md px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none resize-none"
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={projTech}
                    onChange={(e) => setProjTech(e.target.value)}
                    placeholder="Teknologi (e.g. Next.js, PostgreSQL)"
                    className="bg-card border border-border rounded-md px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none"
                  />
                  <input
                    type="text"
                    value={projUrl}
                    onChange={(e) => setProjUrl(e.target.value)}
                    placeholder="URL Proyek (e.g. https://...)"
                    className="bg-card border border-border rounded-md px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none"
                  />
                </div>

                <Button type="submit" size="sm" className="text-xs gap-1">
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambahkan Proyek</span>
                </Button>
              </form>

              {/* Daftar Proyek Tersimpan */}
              <div className="space-y-3">
                <span className="text-xs font-bold text-foreground block">
                  Daftar Proyek Tersimpan
                </span>

                {projectList.length > 0 ? (
                  projectList.map((proj) => (
                    <div
                      key={proj.id}
                      className="p-3.5 rounded-lg border border-border bg-card/60 flex items-start justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-foreground">
                            {proj.title}
                          </h4>
                          {proj.url && (
                            <a
                              href={proj.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-primary hover:underline text-[10px] flex items-center gap-0.5"
                            >
                              <span>Demo</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          )}
                        </div>
                        {proj.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {proj.description}
                          </p>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveProject(proj.id)}
                        className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                        title="Hapus proyek ini"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground italic">
                    Belum ada proyek portofolio terdaftar.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

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
            type="button"
            onClick={handleSubmit}
            size="sm"
            disabled={isSaving}
            className="text-xs gap-1.5"
          >
            {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>Simpan Semua Latar Belakang</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
