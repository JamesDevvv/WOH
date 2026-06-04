"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { Loader2, ImageIcon, Save } from "lucide-react";

interface Props {
  initialHeroBg: string | null;
}

export function HeroCMS({ initialHeroBg }: Props) {
  const [currentUrl, setCurrentUrl] = useState(initialHeroBg ?? "");
  const [inputUrl, setInputUrl] = useState(initialHeroBg ?? "");
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const isDirty = inputUrl !== currentUrl;
  const isValidUrl = inputUrl.startsWith("http://") || inputUrl.startsWith("https://") || inputUrl.startsWith("/");

  function handleSave() {
    startTransition(async () => {
      try {
        // If old file was local and being replaced, delete it
        if (currentUrl?.startsWith("/uploads/") && currentUrl !== inputUrl) {
          await fetch("/api/upload", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ filePath: currentUrl }),
          });
        }
        const res = await fetch("/api/cms/settings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key: "hero_bg", value: inputUrl }),
        });
        if (!res.ok) throw new Error("Failed");
        setCurrentUrl(inputUrl);
        toast({ title: "Hero background updated!" });
      } catch {
        toast({ title: "Failed to save", variant: "destructive" } as Parameters<typeof toast>[0]);
      }
    });
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-base font-semibold text-foreground">Hero Background Photo</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          This photo appears as the background of the public website homepage. Replacing it will remove the old one.
        </p>
      </div>

      {/* Preview */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <ImageIcon className="h-4 w-4" />
            Preview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative w-full h-48 rounded-xl overflow-hidden bg-slate-100 border">
            {inputUrl && (isValidUrl) ? (
              <>
                <Image
                  src={inputUrl}
                  alt="Hero background preview"
                  fill
                  className="object-cover"
                  unoptimized
                />
                <div className="absolute inset-0 bg-[#0A1931]/50" />
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center px-4">
                  <p className="text-xs font-semibold uppercase tracking-widest opacity-70 mb-1">Word of Hope Sta. Clara</p>
                  <p className="text-lg font-bold">Preview of Hero Section</p>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
                <ImageIcon className="h-8 w-8 opacity-30" />
                <p className="text-xs">No background image set</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Upload */}
      <Card>
        <CardContent className="pt-5 space-y-4">
          <div className="space-y-1.5">
            <p className="text-sm font-medium text-foreground">Upload Photo</p>
            <p className="text-xs text-muted-foreground">
              Uploading a new photo will automatically delete the current background.
            </p>
            <ImageUpload
              value={inputUrl}
              onChange={(url) => setInputUrl(url)}
              aspectRatio="banner"
            />
          </div>

          <div className="flex justify-end">
            <Button
              onClick={handleSave}
              disabled={isPending || !isDirty}
              className="gap-2"
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {isPending ? "Saving…" : "Save Background"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
