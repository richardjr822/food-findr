"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import {
  HiOutlinePlus,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineMagnifyingGlass,
  HiMiniXMark,
  HiOutlineSparkles,
  HiOutlineCheckCircle,
  HiOutlineExclamationTriangle,
} from "react-icons/hi2";
import Sidebar from "@/components/sidebar";

type Ingredient = {
  _id: string;
  name: string;
  quantity?: string;
  unit?: string;
  category?: string;
  createdAt: string;
};

type Toast = {
  id: number;
  type: "success" | "error" | "info";
  message: string;
};

const CATEGORIES = ["Vegetables", "Fruits", "Meats", "Dairy", "Grains", "Spices", "Other"];
const UNITS = ["g", "kg", "ml", "L", "cups", "tbsp", "tsp", "pcs", "oz", "lb"];

export default function IngredientsPage() {
  const { data: session } = useSession();
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    quantity: "",
    unit: "",
    category: "Other",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  // Delete confirm modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Ingredient | null>(null);
  const [deleting, setDeleting] = useState(false);
  const deleteRef = useRef<HTMLDivElement>(null);

  // Toasts
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastIdRef = useRef(0);
  function pushToast(message: string, type: Toast["type"] = "success") {
    const id = ++toastIdRef.current;
    setToasts((t) => [...t, { id, type, message }]);
    setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id));
    }, 3000);
  }
  function dismissToast(id: number) {
    setToasts((t) => t.filter((x) => x.id !== id));
  }

  // Fetch ingredients
  useEffect(() => {
    fetchIngredients();
  }, []);

  async function fetchIngredients() {
    setLoading(true);
    try {
      const res = await fetch("/api/ingredients");
      if (!res.ok) throw new Error("Failed to fetch ingredients");
      const data = await res.json();
      setIngredients(data);
    } catch (err: any) {
      console.error(err);
      setError("Failed to load ingredients.");
      pushToast("Failed to load ingredients.", "error");
    } finally {
      setLoading(false);
    }
  }

  // Add or Update ingredient
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Improved validation: require all fields and quantity must be a number
    const name = formData.name.trim();
    const quantity = formData.quantity.trim();
    const unit = formData.unit.trim();
    const category = formData.category.trim();

    if (!name || !quantity || !unit || !category) {
      setError("All fields are required.");
      pushToast("All fields are required.", "error");
      return;
    }

    if (!/^\d+(\.\d+)?$/.test(quantity)) {
      setError("Quantity must be a valid number.");
      pushToast("Quantity must be a valid number.", "error");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const url = editingId ? `/api/ingredients/${editingId}` : "/api/ingredients";
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, quantity, unit, category }),
      });
      if (!res.ok) throw new Error("Failed to save ingredient");
      await fetchIngredients();
      pushToast(editingId ? "Ingredient updated" : "Ingredient added", "success");
      closeModal();
    } catch (err: any) {
      const msg = err.message || "Something went wrong.";
      setError(msg);
      pushToast(msg, "error");
    } finally {
      setSubmitting(false);
    }
  }

  // Delete ingredient via confirm modal
  function openDeleteModal(ingredient: Ingredient) {
    setDeleteTarget(ingredient);
    setShowDeleteModal(true);
  }
  function closeDeleteModal() {
    if (deleting) return;
    setShowDeleteModal(false);
    setDeleteTarget(null);
  }
  async function confirmDelete() {
    if (!deleteTarget?._id) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/ingredients/${deleteTarget._id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete ingredient");
      await fetchIngredients();
      pushToast("Ingredient deleted", "error"); // <-- red toast for delete
      closeDeleteModal();
    } catch (err: any) {
      console.error(err);
      pushToast(err.message || "Failed to delete ingredient.", "error");
    } finally {
      setDeleting(false);
    }
  }

  // Add a state to track the original ingredient when editing
  const [originalData, setOriginalData] = useState<typeof formData | null>(null);

  // Open modal for add/edit
  function openModal(ingredient?: Ingredient) {
    if (ingredient) {
      const original = {
        name: ingredient.name,
        quantity: ingredient.quantity || "",
        unit: ingredient.unit || "",
        category: ingredient.category || "Other",
      };
      setEditingId(ingredient._id);
      setFormData(original);
      setOriginalData(original); // Save original for comparison
    } else {
      setEditingId(null);
      setFormData({ name: "", quantity: "", unit: "", category: "Other" });
      setOriginalData(null);
    }
    setShowModal(true);
    setError("");
  }

  function closeModal() {
    if (submitting) return;
    setShowModal(false);
    setEditingId(null);
    setFormData({ name: "", quantity: "", unit: "", category: "Other" });
    setOriginalData(null);
    setError("");
  }

  // Utility to check if formData is different from originalData
  function isFormChanged() {
    if (!editingId || !originalData) return true; // Always enabled for add
    return (
      formData.name.trim() !== originalData.name.trim() ||
      formData.quantity.trim() !== originalData.quantity.trim() ||
      formData.unit.trim() !== originalData.unit.trim() ||
      formData.category.trim() !== originalData.category.trim()
    );
  }

  // Close modals on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (showModal && modalRef.current && !modalRef.current.contains(e.target as Node)) {
        closeModal();
      }
      if (showDeleteModal && deleteRef.current && !deleteRef.current.contains(e.target as Node)) {
        closeDeleteModal();
      }
    }
    if (showModal || showDeleteModal) {
      document.addEventListener("mousedown", handleClick);
    }
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showModal, showDeleteModal, submitting, deleting]);

  // Filter ingredients by search
  const filteredIngredients = ingredients.filter((ing) =>
    ing.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex h-screen overflow-hidden relative bg-white">
      {/* Subtle background food image, but keep white accent */}
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        aria-hidden="true"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1600&q=80&auto=format&fit=crop')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          opacity: 0.08,
          filter: "brightness(1)",
        }}
      />
      <Sidebar />

      <main className="flex-1 h-full overflow-y-auto relative z-10">
        <div className="h-full w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 sm:mb-8 pb-6 border-b-2 border-neutral-200">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="relative">
                <div className="flex items-center justify-center h-12 w-12 sm:h-14 sm:w-14 rounded-2xl bg-gradient-to-br from-emerald-400 via-emerald-500 to-teal-600 shadow-lg ring-2 ring-emerald-100">
                  <HiOutlinePlus className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600 tracking-tight">
                  My Ingredients
                </h1>
                <p className="text-neutral-600 text-xs sm:text-sm font-medium mt-0.5">
                  🥗 Manage your pantry ingredients
                </p>
              </div>
            </div>
            <button
              onClick={() => openModal()}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-xl px-5 sm:px-6 py-3 shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5 active:scale-95 min-h-[48px]"
            >
              <HiOutlinePlus className="w-5 h-5" />
              <span>Add Ingredient</span>
            </button>
          </div>

          {/* Search Bar */}
          <div className="mb-6 sm:mb-8">
            <div className="relative max-w-full sm:max-w-md">
              <HiOutlineMagnifyingGlass className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
              <input
                type="text"
                placeholder="Search ingredients..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-white border-2 border-neutral-200 rounded-xl pl-11 sm:pl-12 pr-4 py-3 sm:py-3.5 text-sm sm:text-base text-black placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400 transition-all min-h-[48px]"
              />
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-20">
              <HiOutlineSparkles className="h-12 w-12 text-emerald-400 animate-spin mb-4" />
              <p className="text-neutral-600 font-semibold">Loading ingredients...</p>
            </div>
          )}

          {/* Empty State */}
          {!loading && filteredIngredients.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 sm:py-20 px-6 bg-gradient-to-br from-emerald-50/50 via-white to-neutral-50 rounded-2xl sm:rounded-3xl border-2 border-dashed border-emerald-200">
              <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl bg-gradient-to-br from-emerald-100 to-emerald-200 flex items-center justify-center mb-4 shadow-sm">
                <HiOutlinePlus className="h-8 w-8 sm:h-10 sm:w-10 text-emerald-600" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-neutral-800 mb-2 text-center">No ingredients yet</h3>
              <p className="text-sm sm:text-base text-neutral-600 mb-6 text-center max-w-sm">Start building your pantry by adding ingredients!</p>
              <button
                onClick={() => openModal()}
                className="flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold rounded-xl px-6 py-3 shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5 active:scale-95 min-h-[48px]"
              >
                <HiOutlinePlus className="w-5 h-5" />
                <span>Add Your First Ingredient</span>
              </button>
            </div>
          )}

          {/* Ingredients Grid */}
          {!loading && filteredIngredients.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
              {filteredIngredients.map((ing) => (
                <div
                  key={ing._id}
                  className="bg-white rounded-xl sm:rounded-2xl shadow-md border-2 border-neutral-200 p-4 sm:p-5 hover:shadow-xl hover:border-emerald-300 transition-all group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base sm:text-lg font-bold text-neutral-900 group-hover:text-emerald-700 transition truncate">
                        {ing.name}
                      </h3>
                      {ing.category && (
                        <span className="inline-block mt-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                          {ing.category}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-1.5 sm:gap-2 ml-2">
                      <button
                        onClick={() => openModal(ing)}
                        className="p-2 sm:p-2.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all active:scale-95 min-h-[40px] min-w-[40px]"
                        aria-label="Edit"
                      >
                        <HiOutlinePencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openDeleteModal(ing)}
                        className="p-2 sm:p-2.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition-all active:scale-95 min-h-[40px] min-w-[40px]"
                        aria-label="Delete"
                      >
                        <HiOutlineTrash className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  {(ing.quantity || ing.unit) && (
                    <div className="bg-gradient-to-br from-neutral-50 to-white rounded-lg px-3 py-2 border border-neutral-200 mb-2">
                      <p className="text-sm sm:text-base font-bold text-neutral-900">
                        {ing.quantity} <span className="text-neutral-600">{ing.unit}</span>
                      </p>
                    </div>
                  )}
                  <p className="text-xs text-neutral-400 mt-2 font-medium">
                    Added {new Date(ing.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in p-4">
          <div
            ref={modalRef}
            className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl p-6 sm:p-8 max-w-lg w-full animate-scale-in"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-neutral-900">
                {editingId ? "Edit Ingredient" : "Add New Ingredient"}
              </h2>
              <button
                onClick={closeModal}
                disabled={submitting}
                className="p-2 rounded-lg hover:bg-neutral-100 transition disabled:opacity-50 active:scale-95 min-h-[40px] min-w-[40px]"
                aria-label="Close"
              >
                <HiMiniXMark className="w-6 h-6 text-neutral-500" />
              </button>
            </div>

            {error && (
              <div className="mb-4 bg-rose-50 border-2 border-rose-200 rounded-xl p-3 text-rose-700 text-sm font-semibold">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-neutral-900 mb-2">
                  Ingredient Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Chicken Breast"
                  className="w-full rounded-xl border-2 border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-800 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-emerald-300 transition"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-neutral-900 mb-2">
                    Quantity
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    placeholder="e.g. 500"
                    className="w-full rounded-xl border-2 border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-800 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-emerald-300 transition"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-neutral-900 mb-2">
                    Unit
                  </label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full rounded-xl border-2 border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-800 focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-emerald-300 transition"
                  >
                    <option value="">Select unit</option>
                    {UNITS.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-neutral-900 mb-2">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full rounded-xl border-2 border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-800 focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-emerald-300 transition"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={submitting}
                  className="flex-1 py-3 sm:py-3.5 rounded-xl bg-neutral-100 text-neutral-700 font-bold hover:bg-neutral-200 transition-all disabled:opacity-50 active:scale-95 min-h-[48px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={Boolean(submitting || (editingId && !isFormChanged()))}
                  className="flex-1 py-3 sm:py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold hover:from-emerald-700 hover:to-teal-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 active:scale-95 min-h-[48px]"
                >
                  {submitting ? "Saving..." : editingId ? "Update" : "Add"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in p-4">
          <div
            ref={deleteRef}
            className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl p-6 sm:p-8 max-w-md w-full animate-scale-in"
          >
            <div className="flex items-start gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <HiOutlineExclamationTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-neutral-900">Delete ingredient?</h3>
                <p className="text-sm text-neutral-600">
                  This action cannot be undone. You are about to delete{" "}
                  <span className="font-semibold text-neutral-800">
                    {deleteTarget?.name}
                  </span>.
                </p>
              </div>
              <button
                onClick={closeDeleteModal}
                disabled={deleting}
                className="ml-auto p-2 rounded-lg hover:bg-neutral-100 transition disabled:opacity-50"
                aria-label="Close"
              >
                <HiMiniXMark className="w-6 h-6 text-neutral-500" />
              </button>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={closeDeleteModal}
                disabled={deleting}
                className="flex-1 py-3 sm:py-3.5 rounded-xl bg-neutral-100 text-neutral-700 font-bold hover:bg-neutral-200 transition-all disabled:opacity-50 active:scale-95 min-h-[48px]"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="flex-1 py-3 sm:py-3.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 text-white font-bold hover:from-rose-700 hover:to-rose-800 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 active:scale-95 min-h-[48px]"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toasts */}
      <div className="fixed top-4 right-4 z-[60] space-y-3">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`flex items-start gap-4 rounded-2xl border px-6 py-4 shadow-2xl bg-white
        ${
          t.type === "success"
            ? "border-emerald-200"
            : t.type === "error"
            ? "border-rose-400 bg-rose-50"
            : "border-neutral-200"
        }
        animate-toast-in
      `}
            style={{
              minWidth: "320px",
              maxWidth: "400px",
              fontSize: "1.1rem",
            }}
          >
            <div className="mt-0.5">
              {t.type === "success" ? (
                <HiOutlineCheckCircle className="w-6 h-6 text-emerald-600" />
              ) : t.type === "error" ? (
                <HiOutlineExclamationTriangle className="w-6 h-6 text-rose-600" />
              ) : (
                <HiOutlineSparkles className="w-6 h-6 text-emerald-500" />
              )}
            </div>
            <div
              className={`text-base ${
                t.type === "error"
                  ? "text-rose-700 font-semibold"
                  : t.type === "success"
                  ? "text-emerald-700"
                  : "text-neutral-800"
              }`}
            >
              {t.message}
            </div>
            <button
              onClick={() => dismissToast(t.id)}
              className="ml-auto p-1 rounded-md hover:bg-neutral-100"
              aria-label="Dismiss"
            >
              <HiMiniXMark className="w-5 h-5 text-neutral-500" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
