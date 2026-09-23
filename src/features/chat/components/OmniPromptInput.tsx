"use client";

import React, {
  useState,
  useRef,
  useEffect,
  ChangeEvent,
  KeyboardEvent,
  DragEvent,
  FormEvent,
} from "react";
import { Paperclip, ArrowUp, X, FileText, UploadCloud } from "lucide-react";
import { toast } from "sonner";

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

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

  const validateAndAttachFile = (file: File) => {
    if (file.type !== "application/pdf") {
      toast.error("Invalid file format", {
        description: "Please upload your resume in PDF format.",
      });
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      toast.error("File size exceeded", {
        description: `Your file is ${sizeMB} MB. Maximum allowed size is 10 MB.`,
      });
      return;
    }

    setAttachedFile(file);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndAttachFile(e.target.files[0]);
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
      validateAndAttachFile(e.dataTransfer.files[0]);
    }
  };

  const handleRemoveFile = () => {
    setAttachedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = (e?: FormEvent) => {
    if (e) e.preventDefault();
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
      <form
        onSubmit={handleSubmit}
        aria-label="Career prompt and resume input form"
        className={`relative rounded-xl border bg-card/95 shadow-md backdrop-blur-md p-3 transition-all ${
          isDragging
            ? "border-primary ring-2 ring-primary/20 bg-primary/5"
            : "border-border/80 focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/20"
        }`}
      >
        {/* Drag Overlay Hint */}
        {isDragging && (
          <div className="absolute inset-0 rounded-xl bg-card/95 flex items-center justify-center gap-2 z-10 text-primary font-medium text-sm animate-in fade-in">
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
              aria-label="Remove attached CV"
              className="p-1 min-w-[24px] min-h-[24px] flex items-center justify-center hover:bg-secondary rounded text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
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
          aria-label="Career goal or prompt"
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
              aria-label="Upload resume in PDF format"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              aria-label="Attach CV in PDF format up to 10MB"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/70 transition-colors cursor-pointer disabled:opacity-50"
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
            type="submit"
            disabled={!canSubmit}
            aria-label="Send message"
            className={`p-2 rounded-lg transition-all duration-150 flex items-center justify-center ${
              canSubmit
                ? "bg-primary text-primary-foreground hover:opacity-90 shadow-2xs cursor-pointer active:scale-95"
                : "bg-secondary text-muted-foreground cursor-not-allowed opacity-50"
            }`}
          >
            <ArrowUp className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
