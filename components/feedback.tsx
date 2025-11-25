"use client";

import { useEffect, useMemo, useState } from "react";
import { HiOutlineStar, HiStar, HiOutlineTrash, HiOutlinePencilSquare } from "react-icons/hi2";

type Props = {
  recipeId: string;
};

type MyFeedback = {
  _id?: string;
  rating?: number;
  comment?: string;
  type: "quick" | "detailed";
  createdAt?: string;
  updatedAt?: string;
} | null;

export default function Feedback({ recipeId }: Props) {
  const [mode, setMode] = useState<"quick" | "detailed">("quick");
  const [rating, setRating] = useState<number | null>(null);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [my, setMy] = useState<MyFeedback>(null);
  const [stats, setStats] = useState<{ avg: number; count: number } | null>(null);

  async function load() {
    setError("");
    try {
      const [mineRes, allRes] = await Promise.all([
        fetch(`/api/recipes/${encodeURIComponent(recipeId)}/feedback`, { cache: "no-store" }),
        fetch(`/api/recipes/${encodeURIComponent(recipeId)}/feedback?all=1`, { cache: "no-store" }),
      ]);
      const mine = await mineRes.json();
      const all = await allRes.json();
      if (mineRes.ok) {
        const f = mine?.feedback || null;
        setMy(f);
        if (f?.rating != null) setRating(Number(f.rating));
        if (typeof f?.comment === "string") setComment(f.comment);
        if (f?.type === "detailed") setMode("detailed");
      }
      if (allRes.ok) {
        setStats(all?.stats || null);
      }
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recipeId]);

  function starEl(n: number) {
    const filled = (hoverRating ?? rating ?? 0) >= n;
    const Cmp = filled ? HiStar : HiOutlineStar;
    return (
      <button
        key={n}
        type="button"
        onMouseEnter={() => setHoverRating(n)}
        onMouseLeave={() => setHoverRating(null)}
        onClick={() => setRating(n)}
        aria-label={`${n} star${n > 1 ? "s" : ""}`}
        className={`p-1.5 rounded-lg ${filled ? "text-amber-500" : "text-neutral-300 hover:text-amber-400"}`}
      >
        <Cmp className="h-5 w-5" />
      </button>
    );
  }

  async function submitQuick() {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`/api/recipes/${encodeURIComponent(recipeId)}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "quick", rating }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to submit rating");
      setMy(data.feedback || null);
      setSuccess("Rating saved");
      load();
    } catch (e: any) {
      setError(e?.message || "Failed to submit rating");
    } finally {
      setLoading(false);
    }
  }

  async function submitDetailed() {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`/api/recipes/${encodeURIComponent(recipeId)}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "detailed", comment, rating }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to submit review");
      setMy(data.feedback || null);
      setSuccess("Review saved");
      load();
    } catch (e: any) {
      setError(e?.message || "Failed to submit review");
    } finally {
      setLoading(false);
    }
  }

  async function remove() {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`/api/recipes/${encodeURIComponent(recipeId)}/feedback`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to delete feedback");
      setMy(null);
      setRating(null);
      setComment("");
      setSuccess("Feedback removed");
      load();
    } catch (e: any) {
      setError(e?.message || "Failed to delete feedback");
    } finally {
      setLoading(false);
    }
  }

  const hasFeedback = !!(my?.rating || (my?.comment && my.comment.length > 0));

  return (
    <div className="bg-white rounded-xl border border-neutral-200 shadow-sm">
      <div className="px-4 py-3 border-b border-neutral-100 flex items-center justify-between">
        <div className="text-sm font-bold text-neutral-900">Your Feedback</div>
        {stats && (
          <div className="text-[11px] text-neutral-500">
            Avg {stats.avg.toFixed(1)} • {stats.count} rating{stats.count === 1 ? "" : "s"}
          </div>
        )}
      </div>

      <div className="p-4 space-y-4">
        <div className="flex items-center gap-2 bg-neutral-50 p-1 rounded-lg w-max">
          <button
            className={`px-3 py-1.5 rounded-md text-xs font-semibold ${mode === "quick" ? "bg-white border border-neutral-200 text-neutral-900" : "text-neutral-600"}`}
            onClick={() => setMode("quick")}
          >
            Quick rating
          </button>
          <button
            className={`px-3 py-1.5 rounded-md text-xs font-semibold ${mode === "detailed" ? "bg-white border border-neutral-200 text-neutral-900" : "text-neutral-600"}`}
            onClick={() => setMode("detailed")}
          >
            Detailed review
          </button>
        </div>

        {mode === "quick" ? (
          <div className="space-y-3">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map(starEl)}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={submitQuick}
                disabled={loading || !rating}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 px-4 py-2 text-sm text-white font-bold shadow-md hover:shadow-lg transition disabled:opacity-50"
              >
                <HiOutlinePencilSquare className="h-4 w-4" />
                Save Rating
              </button>
              {hasFeedback && (
                <button
                  onClick={remove}
                  disabled={loading}
                  className="inline-flex items-center gap-2 rounded-xl bg-rose-50 border-2 border-rose-200 text-rose-700 px-3 py-2 text-sm font-bold hover:bg-rose-100 transition"
                >
                  <HiOutlineTrash className="h-4 w-4" />
                  Delete
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map(starEl)}
            </div>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your thoughts..."
              rows={4}
              className="w-full rounded-xl border-2 border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-800 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-emerald-300 transition"
            />
            <div className="flex items-center gap-2">
              <button
                onClick={submitDetailed}
                disabled={loading || comment.trim().length < 2}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 px-4 py-2 text-sm text-white font-bold shadow-md hover:shadow-lg transition disabled:opacity-50"
              >
                <HiOutlinePencilSquare className="h-4 w-4" />
                Save Review
              </button>
              {hasFeedback && (
                <button
                  onClick={remove}
                  disabled={loading}
                  className="inline-flex items-center gap-2 rounded-xl bg-rose-50 border-2 border-rose-200 text-rose-700 px-3 py-2 text-sm font-bold hover:bg-rose-100 transition"
                >
                  <HiOutlineTrash className="h-4 w-4" />
                  Delete
                </button>
              )}
            </div>
          </div>
        )}

        {error && (
          <div className="text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2 text-xs font-semibold">
            {error}
          </div>
        )}
        {success && (
          <div className="text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 text-xs font-semibold">
            {success}
          </div>
        )}
      </div>
    </div>
  );
}
