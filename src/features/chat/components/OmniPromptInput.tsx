"use client";

import React, {
  useState,
  useRef,
  useEffect,
  ChangeEvent,
  KeyboardEvent,
  DragEvent,
} from "react";
import { Paperclip, ArrowUp, X, FileText, UploadCloud } from "lucide-react";
import { toast } from "sonner";

interface OmniPromptInputProps {
  onSubmit: (prompt: string, file?: File | null) => void;
  isLoading?: boolean;
  placeholder?: string;
  isSticky?: boolean;
}

export default function OmniPromptInput({
  onSubmit,
  isLoading = false,
  placeholder = "Type your career goal or attach your CV (PDF) for analysis...",
  isSticky = false,
}: OmniPromptInputProps) {
  const [prompt, setPrompt] = useState("");
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      const maxHeight = isSticky ? 160 : 200;
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        maxHeight,
      )}px`;
    }
  }, [prompt, isSticky]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type === "application/pdf") {
        setAttachedFile(file);
      } else {
        toast.error("Invalid file format", {
          description: "Please upload your resume in PDF format.",
        });
      }
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === "application/pdf") {
        setAttachedFile(file);
      } else {
        toast.error("Invalid file format", {
          description: "Please upload your resume in PDF format.",
        });
      }
    }
  };

  const handleRemoveFile = () => {
    setAttachedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = () => {
    if ((!prompt.trim() && !attachedFile) || isLoading) return;
    onSubmit(prompt.trim(), attachedFile);
    setPrompt("");
    setAttachedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const canSubmit =
    (prompt.trim().length > 0 || attachedFile !== null) && !isLoading;

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`w-full transition-all duration-200 ${
        isSticky ? "max-w-3xl mx-auto px-4" : "max-w-2xl mx-auto"
      }`}
    >
      <div
        className={`relative rounded-2xl border bg-card/95 shadow-md backdrop-blur-md p-3 transition-all ${
          isDragging
            ? "border-primary ring-2 ring-primary/20 bg-primary/5"
            : "border-border/80 focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/20"
        }`}
      >
        {/* Drag Overlay Hint */}
        {isDragging && (
          <div className="absolute inset-0 rounded-2xl bg-card/95 flex items-center justify-center gap-2 z-10 text-primary font-medium text-sm animate-in fade-in">
            <UploadCloud className="w-5 h-5 animate-bounce" />
            <span>Drop your CV (PDF) here</span>
          </div>
        )}

        {/* Attached File Preview Badge */}
        {attachedFile && (
          <div className="flex items-center gap-2 mb-2 p-1.5 px-3 rounded-lg bg-secondary/80 border border-border/80 w-fit text-xs text-foreground">
            <FileText className="w-3.5 h-3.5 text-primary" />
            <span className="font-medium truncate max-w-xs">
              {attachedFile.name}
            </span>
            <span className="text-[10px] text-muted-foreground">
              ({(attachedFile.size / 1024 / 1024).toFixed(2)} MB)
            </span>
            <button
              type="button"
              onClick={handleRemoveFile}
              className="p-0.5 hover:bg-secondary rounded text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Dynamic Auto-Expanding Text Area */}
        <textarea
          ref={textareaRef}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={1}
          disabled={isLoading}
          className="w-full resize-none bg-transparent text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none leading-relaxed py-1 min-h-[38px] max-h-[160px] overflow-y-auto scrollbar-thin"
        />

        {/* Action Toolbar */}
        <div className="flex items-center justify-between pt-2 border-t border-border/40 mt-1">
          {/* File Attachment Button */}
          <div className="flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".pdf"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/70 transition-colors cursor-pointer"
              title="Attach CV (PDF)"
            >
              <Paperclip className="w-3.5 h-3.5" />
              <span>Attach CV</span>
            </button>
            <span className="hidden sm:inline text-[11px] text-muted-foreground/60">
              PDF up to 10MB
            </span>
          </div>

          {/* Send Button */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={`p-2 rounded-xl transition-all duration-150 flex items-center justify-center ${
              canSubmit
                ? "bg-primary text-primary-foreground hover:opacity-90 shadow-sm cursor-pointer active:scale-95"
                : "bg-secondary text-muted-foreground cursor-not-allowed opacity-50"
            }`}
          >
            <ArrowUp className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
