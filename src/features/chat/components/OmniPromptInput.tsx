"use client";

import React, {
  useState,
  useRef,
  useEffect,
  useMemo,
  ChangeEvent,
  KeyboardEvent,
  DragEvent,
  FormEvent,
} from "react";
import { Paperclip, ArrowUp, X, FileText, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import { hasPdfSignature } from "@/lib/files/pdf-signature";
import {
  listAvailableCommands,
  findChatCommand,
  type ChatCommandDefinition,
} from "../commands/chat-commands";

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const MAX_PROMPT_CHARS = 2000;

interface OmniPromptInputProps {
  onSubmit: (prompt: string, file?: File | null) => Promise<void> | void;
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
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  const validateAndAttachFile = async (file: File) => {
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

    if (!(await hasPdfSignature(file))) {
      toast.error("Invalid file format", {
        description: "This file is not a valid PDF document.",
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

  const handleSubmit = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    if ((!prompt.trim() && !attachedFile) || isLoading || isSubmitting) return;

    const currentPrompt = prompt.trim();
    const currentFile = attachedFile;

    try {
      setIsSubmitting(true);
      await onSubmit(currentPrompt, currentFile);
      setPrompt("");
      setAttachedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    } catch {
      // Retain prompt and attachment if submit fails so user does not lose work
    } finally {
      setIsSubmitting(false);
    }
  };

  // Command palette: open only while the user is typing a command name, never
  // while writing its arguments, so Enter keeps its normal send behaviour.
  const commandQuery = useMemo(() => {
    const trimmed = prompt.trimStart();
    if (!trimmed.startsWith("/")) return null;
    const withoutSlash = trimmed.slice(1);
    if (withoutSlash.includes(" ")) return null;
    return withoutSlash.toLowerCase();
  }, [prompt]);

  const paletteCommands = useMemo(() => {
    if (commandQuery === null) return [];
    return listAvailableCommands().filter((command) =>
      command.name.startsWith(commandQuery),
    );
  }, [commandQuery]);

  const [activeCommandIndex, setActiveCommandIndex] = useState(0);
  const [dismissedCommandQuery, setDismissedCommandQuery] = useState<
    string | null
  >(null);

  const isPaletteOpen =
    commandQuery !== null &&
    paletteCommands.length > 0 &&
    dismissedCommandQuery !== commandQuery &&
    !isLoading &&
    !isSubmitting;

  const safeActiveIndex =
    paletteCommands.length > 0
      ? activeCommandIndex % paletteCommands.length
      : 0;

  // Command mode signals: the message starts with a slash, so the input must look
  // different from normal prose and say whether the slash is a real command.
  const trimmedPrompt = prompt.trimStart();
  const isCommandMode =
    trimmedPrompt.startsWith("/") && trimmedPrompt.length > 1;
  const commandToken = isCommandMode
    ? trimmedPrompt.slice(1).split(/\s+/)[0].toLowerCase()
    : "";
  const knownCommand = isCommandMode
    ? findChatCommand(commandToken)
    : undefined;

  const applyCommand = (command: ChatCommandDefinition) => {
    setPrompt(`/${command.name} `);
    setActiveCommandIndex(0);
    setDismissedCommandQuery(null);
    requestAnimationFrame(() => textareaRef.current?.focus());
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (isPaletteOpen) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveCommandIndex((index) => (index + 1) % paletteCommands.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveCommandIndex(
          (index) =>
            (index - 1 + paletteCommands.length) % paletteCommands.length,
        );
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setDismissedCommandQuery(commandQuery);
        return;
      }
      if (e.key === "Tab" || (e.key === "Enter" && !e.shiftKey)) {
        e.preventDefault();
        applyCommand(paletteCommands[safeActiveIndex]);
        return;
      }
    }

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const canSubmit =
    (prompt.trim().length > 0 || attachedFile !== null) &&
    !isLoading &&
    !isSubmitting;

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`w-full min-w-[320px] transition-all duration-200 ${
        isSticky
          ? "px-4 sm:px-6 md:px-8 lg:px-12"
          : "max-w-3xl lg:max-w-4xl mx-auto px-4"
      }`}
    >
      <form
        onSubmit={handleSubmit}
        aria-label="Message and CV upload"
        className={`relative rounded-sm border bg-card/95 shadow-md backdrop-blur-md p-1.5 sm:p-2 transition-all ${
          isDragging
            ? "border-primary ring-2 ring-primary/20 bg-primary/5"
            : "border-border/80"
        }`}
      >
        {/* Drag Overlay Hint */}
        {isDragging && (
          <div className="absolute inset-0 rounded-sm bg-card/95 flex items-center justify-center gap-2 z-10 text-primary font-medium text-sm animate-in fade-in">
            <UploadCloud className="w-5 h-5 animate-bounce" />
            <span>Drop your CV (PDF) here</span>
          </div>
        )}

        {/* Attached File Preview Badge */}
        {attachedFile && (
          <div className="flex items-center gap-2 mb-2 p-1 px-2.5 rounded-sm bg-secondary/80 border border-border/80 w-fit text-xs text-foreground animate-in fade-in">
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
              className="p-1 hover:bg-destructive/10 rounded-sm text-muted-foreground hover:text-destructive cursor-pointer transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Compact Horizontal Input Row */}
        {isPaletteOpen && (
          <div
            id="chat-command-palette"
            role="listbox"
            aria-label="Available commands"
            className="absolute bottom-full left-0 right-0 mb-2 z-30 rounded-sm border border-border bg-card shadow-lg overflow-hidden"
          >
            {paletteCommands.map((command, index) => (
              <div
                key={command.name}
                id={`chat-command-${command.name}`}
                role="option"
                aria-selected={index === safeActiveIndex}
                onMouseDown={(event) => {
                  event.preventDefault();
                  applyCommand(command);
                }}
                className={`w-full text-left px-3 py-2.5 min-h-[44px] flex flex-col gap-0.5 border-b border-border/60 last:border-b-0 transition-colors cursor-pointer ${
                  index === safeActiveIndex
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:bg-secondary/60"
                }`}
              >
                <span className="text-xs font-semibold font-mono text-foreground">
                  {command.usage}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {command.summary}
                </span>
              </div>
            ))}
          </div>
        )}

        {isCommandMode && !isPaletteOpen && (
          <div
            className={`absolute bottom-full left-0 right-0 mb-2 z-20 flex items-center gap-2 rounded-sm border px-3 py-2 text-[11px] ${
              knownCommand
                ? "border-primary/30 bg-primary/5"
                : "border-amber-500/30 bg-amber-500/10"
            }`}
          >
            <span
              className={`font-mono font-semibold ${
                knownCommand
                  ? "text-primary"
                  : "text-amber-600 dark:text-amber-400"
              }`}
            >
              /{commandToken}
            </span>
            <span className="text-muted-foreground truncate">
              {knownCommand
                ? `${knownCommand.summary} · Enter to run`
                : "Not a command. This will be sent as a normal message."}
            </span>
          </div>
        )}

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
            disabled={isLoading || isSubmitting}
            aria-label="Attach CV (PDF up to 5MB)"
            title="Attach CV (PDF)"
            className="w-10 h-10 sm:w-11 sm:h-11 min-w-[40px] min-h-[40px] sm:min-w-[44px] sm:min-h-[44px] shrink-0 flex items-center justify-center rounded-sm text-muted-foreground hover:text-foreground hover:bg-secondary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 transition-colors cursor-pointer disabled:opacity-50"
          >
            <Paperclip className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
          </button>

          {/* Dynamic Auto-Expanding Text Area */}
          <textarea
            ref={textareaRef}
            value={prompt}
            onChange={(e) => {
              setPrompt(e.target.value);
              setActiveCommandIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            rows={1}
            maxLength={MAX_PROMPT_CHARS}
            readOnly={isLoading || isSubmitting}
            aria-label="Message"
            aria-controls="chat-command-palette"
            aria-autocomplete="list"
            aria-activedescendant={
              isPaletteOpen
                ? `chat-command-${paletteCommands[safeActiveIndex]?.name}`
                : undefined
            }
            className={`flex-1 resize-none bg-transparent text-xs sm:text-sm placeholder:text-muted-foreground/60 focus:outline-none leading-relaxed py-2.5 px-2 min-h-[40px] max-h-[140px] overflow-y-auto custom-scrollbar ${
              isCommandMode
                ? "font-mono font-medium text-primary"
                : "text-foreground"
            }`}
          />

          {prompt.length === 0 && !attachedFile && (
            <span className="hidden sm:inline text-[10px] text-muted-foreground/70 shrink-0 pb-2.5 font-mono">
              / commands
            </span>
          )}

          {/* Character counter (only when approaching limit) */}
          {prompt.length > 1500 && (
            <span
              className={`text-[10px] font-mono shrink-0 pb-2.5 transition-colors ${
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
            className={`w-10 h-10 sm:w-11 sm:h-11 min-w-[40px] min-h-[40px] sm:min-w-[44px] sm:min-h-[44px] shrink-0 rounded-sm transition-all duration-150 flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
              canSubmit
                ? "bg-primary text-primary-foreground hover:opacity-95 shadow-2xs cursor-pointer active:scale-95"
                : "bg-secondary text-muted-foreground cursor-not-allowed opacity-40"
            }`}
          >
            <ArrowUp className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
          </button>
        </div>
      </form>
    </div>
  );
}
