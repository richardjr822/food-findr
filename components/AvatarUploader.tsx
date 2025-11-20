"use client";

import { useState, useEffect, useRef } from "react";
import { HiOutlineUser, HiOutlineCamera } from "react-icons/hi2";
import { toast } from "sonner";

export function AvatarUploader({ currentUrl, onUrlChange }: { currentUrl: string; onUrlChange: (url: string) => void }) {
  const [previewUrl, setPreviewUrl] = useState(currentUrl);
  const [uploading, setUploading] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [showUrlInput, setShowUrlInput] = useState(false);
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
      // Create local preview
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setPreviewUrl(result);
        // For now, we'll use a placeholder URL since no storage is configured
        // In production, you would upload to a storage service here
        toast.info("Avatar preview updated. Note: Upload to cloud storage not yet configured.");
        onUrlChange(result); // Pass the data URL for preview
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setError("Failed to process image");
      toast.error("Failed to process image");
    } finally {
      setUploading(false);
    }
  };

  const handleUrlSubmit = () => {
    const trimmed = urlInput.trim();
    if (!trimmed) {
      setError("Please enter a URL");
      return;
    }

    try {
      new URL(trimmed);
      setPreviewUrl(trimmed);
      onUrlChange(trimmed);
      setUrlInput("");
      setShowUrlInput(false);
      setError("");
      toast.success("Avatar URL updated");
    } catch {
      setError("Invalid URL format");
      toast.error("Invalid URL format");
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
            <button
              type="button"
              onClick={() => setShowUrlInput(!showUrlInput)}
              className="text-xs px-3 py-1.5 bg-neutral-100 text-neutral-700 rounded-lg hover:bg-neutral-200 transition font-medium"
            >
              {showUrlInput ? "Cancel" : "Use URL"}
            </button>
          </div>
          {showUrlInput && (
            <div className="flex gap-2">
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://example.com/avatar.jpg"
                className="flex-1 text-xs border border-neutral-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-200"
              />
              <button
                type="button"
                onClick={handleUrlSubmit}
                className="text-xs px-3 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-medium"
              >
                Apply
              </button>
            </div>
          )}
          <p className="text-xs text-neutral-500">JPG, PNG, GIF or WebP. Max 5MB.</p>
          {error && <p className="text-xs text-rose-600">{error}</p>}
        </div>
      </div>
    </div>
  );
}
