"use client";

import { useEffect, useState } from "react";
import { HiOutlineClipboard, HiOutlinePaperAirplane, HiOutlineXMark } from "react-icons/hi2";
import { toast } from "sonner";

type Props = {
  recipeId: string;
  onClose?: () => void;
};

export default function ShareMenu({ recipeId, onClose }: Props) {
  const [url, setUrl] = useState<string>("");
  const [token, setToken] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function ensureLink() {
    if (url) return { url, token };
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/recipes/${encodeURIComponent(recipeId)}/share`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to create share link");
      setUrl(String(data.url));
      setToken(String(data.token));
      return { url: String(data.url), token: String(data.token) };
    } catch (e: any) {
      setError(e?.message || "Failed to create share link");
      throw e;
    } finally {
      setLoading(false);
    }
  }

  async function bump(method: "copy" | "webshare") {
    try {
      if (!token) return;
      await fetch(`/api/share/${encodeURIComponent(token)}/bump`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method }),
      });
    } catch {
      // ignore
    }
  }

  async function onCopy() {
    try {
      const { url } = await ensureLink();
      await navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard");
      bump("copy");
      onClose?.();
    } catch (e: any) {
      toast.error(e?.message || "Copy failed");
    }
  }

  async function onWebShare() {
    try {
      const { url } = await ensureLink();
      if ((navigator as any).share) {
        await (navigator as any).share({ title: "Recipe", url });
        toast.success("Shared successfully");
        bump("webshare");
        onClose?.();
      } else {
        await navigator.clipboard.writeText(url);
        toast.success("Link copied (Web Share not supported)");
        bump("copy");
        onClose?.();
      }
    } catch (e: any) {
      toast.error(e?.message || "Share failed");
    }
  }

  return (
    <div className="mt-2 w-full max-w-xs rounded-xl border border-neutral-200 bg-white shadow-lg p-3 text-sm">
      <div className="flex items-center justify-between mb-2">
        <div className="font-bold text-neutral-900">Share Recipe</div>
        <button onClick={onClose} className="p-1 rounded hover:bg-neutral-100">
          <HiOutlineXMark className="h-4 w-4 text-neutral-500" />
        </button>
      </div>
      {error && (
        <div className="mb-2 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded px-2 py-1">{error}</div>
      )}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={onCopy}
          disabled={loading}
          className="flex items-center justify-center gap-2 rounded-lg border-2 border-neutral-200 px-3 py-2 font-bold hover:border-emerald-300 hover:bg-emerald-50 text-neutral-800 disabled:opacity-50"
        >
          <HiOutlineClipboard className="h-4 w-4" />
          Copy Link
        </button>
        <button
          onClick={onWebShare}
          disabled={loading}
          className="flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 px-3 py-2 font-bold text-white shadow hover:shadow-md disabled:opacity-50"
        >
          <HiOutlinePaperAirplane className="h-4 w-4" />
          Share…
        </button>
      </div>
      {url && (
        <div className="mt-2 text-[11px] text-neutral-500 break-all select-all">{url}</div>
      )}
    </div>
  );
}
