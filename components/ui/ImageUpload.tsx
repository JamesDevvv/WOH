"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Upload, X, Loader2, ImageIcon } from "lucide-react";

interface Props {
  value: string;
  onChange: (url: string) => void;
  aspectRatio?: "square" | "video" | "banner";
}

export function ImageUpload({ value, onChange, aspectRatio = "banner" }: Props) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const heightClass =
    aspectRatio === "square" ? "aspect-square" :
    aspectRatio === "video"  ? "aspect-video"  :
    "h-44";

  async function handleFile(file: File) {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      if (value?.startsWith("/uploads/")) fd.append("oldPath", value);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (data.url) onChange(data.url);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-1.5">
      <div
        onClick={() => !uploading && inputRef.current?.click()}
        className={`relative w-full ${heightClass} rounded-xl overflow-hidden border-2 border-dashed border-slate-200 bg-slate-50 cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-colors group`}
      >
        {value ? (
          <>
            <Image src={value} alt="Preview" fill className="object-cover" unoptimized />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
              <span className="text-white text-xs font-semibold bg-black/50 px-3 py-1.5 rounded-full flex items-center gap-1.5">
                <Upload className="h-3.5 w-3.5" /> Change Photo
              </span>
            </div>
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-slate-400">
            <ImageIcon className="h-8 w-8" />
            <span className="text-sm font-medium">Click to upload photo</span>
            <span className="text-xs">JPG, PNG, WEBP</span>
          </div>
        )}
        {uploading && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <Loader2 className="h-8 w-8 text-white animate-spin" />
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
      />

      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 transition-colors"
        >
          <X className="h-3 w-3" /> Remove photo
        </button>
      )}
    </div>
  );
}
