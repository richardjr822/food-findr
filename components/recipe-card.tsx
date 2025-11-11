"use client";

import { useState } from "react";
import { Trash2, Clock, Bookmark } from "lucide-react";
import { toast } from "sonner";

type RecipeCardProps = {
  recipe: {
    _id: string;
    title: string;
    time?: string;
    image?: string;
    saved?: boolean;
  };
  onDelete?: (id: string) => void;
  onUnsave?: (id: string) => void;
};

export default function RecipeCard({ recipe, onDelete, onUnsave }: RecipeCardProps) {
  const [showConfirm, setShowConfirm] = useState(false);

  async function handleDelete() {
    try {
      const res = await fetch(`/api/recipes?id=${encodeURIComponent(recipe._id)}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Delete failed");
      toast.success("Recipe deleted successfully");
      onDelete?.(recipe._id);
    } catch (error) {
      toast.error("Failed to delete recipe");
    } finally {
      setShowConfirm(false);
    }
  }

  async function handleUnsave() {
    try {
      // Adjust to your unsave endpoint if different
      const res = await fetch(
        `/api/recipes/save?threadId=${recipe._id}&messageId=${recipe._id}`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error("Unsave failed");
      toast.success("Recipe unsaved");
      onUnsave?.(recipe._id);
    } catch (error) {
      toast.error("Failed to unsave recipe");
    }
  }

  return (
    <>
      <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow overflow-hidden">
        {recipe.image && (
          <img src={recipe.image} alt={recipe.title} className="w-full h-48 object-cover" />
        )}
        <div className="p-5">
          <h3 className="text-xl font-semibold text-gray-800 mb-2 line-clamp-2">
            {recipe.title}
          </h3>
          {recipe.time && (
            <div className="flex items-center gap-1 text-gray-600 text-sm mb-3">
              <Clock className="w-4 h-4" />
              <span>{recipe.time}</span>
            </div>
          )}
          <div className="flex gap-2 mt-4">
            {recipe.saved && onUnsave && (
              <button
                onClick={handleUnsave}
                className="flex-1 flex items-center justify-center gap-2 bg-orange-100 hover:bg-orange-200 text-orange-600 py-2 px-4 rounded-lg transition-colors"
                title="Unsave recipe"
              >
                <Bookmark className="w-4 h-4 fill-current" />
                Unsave
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => setShowConfirm(true)}
                className="p-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition-colors"
                title="Delete recipe"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {showConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Delete Recipe?</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this recipe? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}