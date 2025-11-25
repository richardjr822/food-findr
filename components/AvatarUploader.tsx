"use client";

import { useState, useEffect, useRef } from "react";
import { HiOutlineUser, HiOutlineCamera } from "react-icons/hi2";
import { toast } from "sonner";

export function AvatarUploader({ currentUrl, onUrlChange }: { currentUrl: string; onUrlChange: (url: string) => void }) {
  const [previewUrl, setPreviewUrl] = useState(currentUrl);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setPreviewUrl(currentUrl);
  }, [currentUrl]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
    if (!validTypes.includes(file.type)) {
      setError("Invalid file type. Please upload a JPG, PNG, GIF, or WebP image.");
      toast.error("Invalid file type. Please upload a JPG, PNG, GIF, or WebP image.");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("File is too large. Maximum size is 5MB.");
      toast.error("File is too large. Maximum size is 5MB.");
      return;
    }

    setError("");
    setUploading(true);

    try {
      // Local preview immediately
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setPreviewUrl(result);
      };
      reader.readAsDataURL(file);

      // Upload to server
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/user/profile/avatar", {
        method: "POST",
        body: form,
      });
      const data = await res.json().catch(() => ({} as any));
      if (!res.ok || !data?.url) {
        throw new Error(data?.error || "Failed to upload avatar");
      }
      setPreviewUrl(data.url);
      onUrlChange(data.url); // only set final URL (avoid data: URLs in form state)
      toast.success("Profile picture updated");
    } catch (err: any) {
      setError(err?.message || "Failed to upload avatar");
      toast.error(err?.message || "Failed to upload avatar");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-semibold mb-1 text-neutral-800">Profile Picture</label>
      <div className="flex items-start gap-4">
        <div className="relative group">
          <div className="h-24 w-24 rounded-full overflow-hidden bg-neutral-100 border-2 border-neutral-200 shadow-sm">
            {previewUrl ? (
              <img src={previewUrl} alt="Profile" className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-neutral-400">
                <HiOutlineUser className="h-12 w-12" />
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white disabled:cursor-not-allowed"
          >
            <HiOutlineCamera className="h-6 w-6" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
        <div className="flex-1 space-y-2">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="text-xs px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition disabled:opacity-50 font-medium"
            >
              {uploading ? "Uploading..." : "Upload Image"}
            </button>
          </div>
          <p className="text-xs text-neutral-500">JPG, PNG, GIF or WebP. Max 5MB.</p>
          {error && <p className="text-xs text-rose-600">{error}</p>}
        </div>
      </div>
    </div>
  );
}
