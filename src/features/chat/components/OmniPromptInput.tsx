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

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const MAX_PROMPT_CHARS = 2000;

interface OmniPromptInputProps {
  onSubmit: (prompt: string, file?: File | null) => void;
  isLoading?: boolean;
  placeholder?: string;
  isSticky?: boolean;
}

export default function OmniPromptInput({
  onSubmit,
  isLoading = false,
  placeholder = "Type a message",
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
        description: `Your file is ${sizeMB} MB. Maximum allowed size is 5 MB.`,
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
        aria-label="Message and CV upload"
        className={`relative rounded-2xl border bg-card/95 shadow-md backdrop-blur-md p-2 sm:p-2.5 transition-all ${
          isDragging
            ? "border-primary ring-2 ring-primary/20 bg-primary/5"
            : "border-border/80"
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
          <div className="flex items-center gap-2 mb-2 p-1 px-2.5 rounded-xl bg-secondary/80 border border-border/80 w-fit text-xs text-foreground animate-in fade-in">
            <FileText className="w-3.5 h-3.5 text-primary shrink-0" />
            <span className="font-medium truncate max-w-xs">
              {attachedFile.name}
            </span>
            <span className="text-[10px] text-muted-foreground shrink-0">
              ({(attachedFile.size / 1024 / 1024).toFixed(2)} MB)
            </span>
            <button
              type="button"
              onClick={handleRemoveFile}
              aria-label="Remove attached CV"
              className="p-1 hover:bg-destructive/10 rounded-lg text-muted-foreground hover:text-destructive cursor-pointer transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Compact Horizontal Input Row */}
        <div className="flex items-end gap-1.5 sm:gap-2">
          {/* File Attachment Button (Icon Only on Left) */}
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
            aria-label="Attach CV (PDF up to 5MB)"
            title="Attach CV (PDF)"
            className="w-9 h-9 shrink-0 flex items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 transition-colors cursor-pointer disabled:opacity-50"
          >
            <Paperclip className="w-4 h-4" />
          </button>

          {/* Dynamic Auto-Expanding Text Area */}
          <textarea
            ref={textareaRef}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            rows={1}
            maxLength={MAX_PROMPT_CHARS}
            disabled={isLoading}
            aria-label="Message"
            className="flex-1 resize-none bg-transparent text-xs sm:text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none leading-relaxed py-2 px-1 min-h-[36px] max-h-[140px] overflow-y-auto custom-scrollbar"
          />

          {/* Character counter (only when approaching limit) */}
          {prompt.length > 1500 && (
            <span
              className={`text-[10px] font-mono shrink-0 pb-2 transition-colors ${
                prompt.length >= MAX_PROMPT_CHARS
                  ? "text-destructive font-semibold"
                  : "text-muted-foreground"
              }`}
            >
              {prompt.length}/{MAX_PROMPT_CHARS}
            </span>
          )}

          {/* Submit Button on Right */}
          <button
            type="submit"
            disabled={!canSubmit}
            aria-label="Send message"
            title="Send message"
            className={`w-9 h-9 shrink-0 rounded-xl transition-all duration-150 flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
              canSubmit
                ? "bg-primary text-primary-foreground hover:opacity-95 shadow-2xs cursor-pointer active:scale-95"
                : "bg-secondary text-muted-foreground cursor-not-allowed opacity-40"
            }`}
          >
            <ArrowUp className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
