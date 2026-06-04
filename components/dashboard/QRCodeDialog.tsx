"use client";

import { useState, useEffect, useTransition, useRef } from "react";
import QRCode from "react-qr-code";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { getOrCreateAttendanceQR, toggleAttendanceQR } from "@/lib/actions/attendance-qr";
import { Loader2, Copy, Check, QrCode, Power, PowerOff } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: string;
  serviceType: string;
}

export function QRCodeDialog({ open, onOpenChange, date, serviceType }: Props) {
  const [qr, setQr] = useState<{ id: string; token: string; isActive: boolean } | null>(null);
  const [loading, setLoading] = useState(false);
  const [togglePending, startToggleTransition] = useTransition();
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) { setQr(null); return; }
    setLoading(true);
    getOrCreateAttendanceQR(date, serviceType)
      .then(({ qr: fetched }) => setQr(fetched))
      .catch(() => toast({ title: "Failed to load QR code", variant: "destructive" } as Parameters<typeof toast>[0]))
      .finally(() => setLoading(false));
  }, [open, date, serviceType]);

  const url = qr && typeof window !== "undefined"
    ? `${window.location.origin}/attend/${qr.token}`
    : "";

  function copyLink() {
    if (!url) return;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleToggle() {
    if (!qr) return;
    startToggleTransition(async () => {
      try {
        const { qr: updated } = await toggleAttendanceQR(qr.id, !qr.isActive);
        setQr(updated);
        toast({ title: updated.isActive ? "QR code activated" : "QR code deactivated" });
      } catch {
        toast({ title: "Failed to update QR code", variant: "destructive" } as Parameters<typeof toast>[0]);
      }
    });
  }

  function handlePrint() {
    if (!printRef.current) return;
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`
      <html>
        <head>
          <title>Attendance QR — ${serviceType}</title>
          <style>
            body { font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: white; }
            .container { text-align: center; padding: 32px; }
            h2 { font-size: 24px; font-weight: 700; margin: 0 0 4px; }
            p { color: #64748b; margin: 4px 0; font-size: 14px; }
            .qr { margin: 24px auto; }
            .hint { margin-top: 16px; font-size: 13px; color: #94a3b8; }
          </style>
        </head>
        <body>
          <div class="container">
            <p style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#3b82f6;font-weight:600;">Word of Hope Sta. Clara</p>
            <h2>${serviceType}</h2>
            <p>${new Date(date + "T00:00:00").toLocaleDateString("en-PH", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</p>
            <div class="qr">${printRef.current.innerHTML}</div>
            <p class="hint">Scan to record your attendance</p>
          </div>
          <script>window.onload = function(){ window.print(); window.close(); }</script>
        </body>
      </html>
    `);
    win.document.close();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm w-[calc(100vw-2rem)]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-4 w-4" />
            Attendance QR Code
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 w-full min-w-0">
          {/* Session info */}
          <div className="text-center w-full">
            <p className="text-sm font-semibold text-foreground">{serviceType}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {new Date(date + "T00:00:00").toLocaleDateString("en-PH", {
                weekday: "long", month: "long", day: "numeric", year: "numeric",
              })}
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : qr ? (
            <>
              {/* QR Code box */}
              <div className={`relative w-full rounded-xl border bg-white ${!qr.isActive ? "opacity-40 grayscale" : ""}`}>
                <div ref={printRef} className="flex items-center justify-center p-5">
                  <QRCode
                    value={url}
                    size={180}
                    style={{ display: "block", width: "100%", maxWidth: 180, height: "auto" }}
                    viewBox="0 0 180 180"
                  />
                </div>
                {!qr.isActive && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/10">
                    <span className="bg-white text-xs font-semibold text-red-600 px-3 py-1 rounded-full border border-red-200">
                      Inactive
                    </span>
                  </div>
                )}
              </div>

              {/* URL row */}
              <div className="flex items-center gap-2 bg-muted rounded-xl px-3 py-2.5 overflow-hidden">
                <span className="flex-1 text-xs text-muted-foreground truncate">{url}</span>
                <button
                  onClick={copyLink}
                  className="shrink-0 p-1 rounded hover:bg-background hover:text-foreground transition-colors text-muted-foreground"
                >
                  {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>

              {/* Action buttons */}
              <div className="w-full flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 gap-1.5"
                  onClick={handleToggle}
                  disabled={togglePending}
                >
                  {togglePending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : qr.isActive ? (
                    <PowerOff className="h-3.5 w-3.5 text-red-500" />
                  ) : (
                    <Power className="h-3.5 w-3.5 text-green-500" />
                  )}
                  {qr.isActive ? "Deactivate" : "Activate"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 gap-1.5"
                  onClick={handlePrint}
                  disabled={!qr.isActive}
                >
                  Print QR
                </Button>
              </div>

              {qr.isActive && (
                <p className="text-xs text-muted-foreground text-center">
                  Members scan this to record their own attendance
                </p>
              )}
            </>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
