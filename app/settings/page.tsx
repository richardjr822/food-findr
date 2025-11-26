"use client";

import { useState, useEffect, useRef, type ReactNode } from "react";

import { HiOutlineUser, HiOutlineLockClosed, HiOutlineEye, HiOutlineEyeSlash, HiOutlineCheckCircle, HiOutlineExclamationCircle, HiOutlineInformationCircle, HiOutlineXMark } from "react-icons/hi2";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { z } from "zod";
import Sidebar from "@/components/sidebar";
import { AvatarUploader } from "@/components/AvatarUploader";

type UserProfile = {
  firstName?: string;
  lastName?: string;
  email: string;
  bio?: string;
  profilePic?: string;
};

type NormalizedProfile = {
  firstName: string;
  lastName: string;
  bio: string;
  profilePic: string;
  email: string;
};

// Client-side Zod schemas for validation
const ProfileFormSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(1, "First name is required")
    .max(100, "First name is too long")
    .refine((v) => !/\d/.test(v), "Numbers are not allowed"),
  lastName: z
    .string()
    .trim()
    .min(1, "Last name is required")
    .max(100, "Last name is too long")
    .refine((v) => !/\d/.test(v), "Numbers are not allowed"),
  bio: z.string().trim().max(280, "Bio must be 280 characters or less").optional(),
});

const PasswordFormSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password is too long")
    .regex(/(?=.*[0-9!@#$%^&*()_+\-={}\\[\]:";'<>?,.\\/])/, "Password must contain at least one number or symbol"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
}).refine((data) => data.currentPassword !== data.newPassword, {
  message: "New password must be different from current password",
  path: ["newPassword"],
});

function normalizeProfileValues(profile: UserProfile | null): NormalizedProfile | null {
  if (!profile) return null;
  return {
    firstName: (profile.firstName ?? "").trim(),
    lastName: (profile.lastName ?? "").trim(),
    bio: (profile.bio ?? "").trim(),
    profilePic: (profile.profilePic ?? "").trim(),
    email: (profile.email ?? "").trim(),
  };
}

export default function SettingsPage() {
  const { data: session } = useSession();
  const firstName = session?.user?.name?.split(" ")[0] || "there";

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialProfile, setInitialProfile] = useState<NormalizedProfile | null>(null);

  // Section-specific states
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Password change
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwSaving, setPwSaving] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSuccess, setPwSuccess] = useState<string | null>(null);
  const [pwValidationErrors, setPwValidationErrors] = useState<Record<string, string>>({});

  const [activeModal, setActiveModal] = useState<"profile" | "password" | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [profileValidationErrors, setProfileValidationErrors] = useState<Record<string, string>>({});

  // Load user settings
  useEffect(() => {
    setLoading(true);
    (async () => {
      try {
        const res = await fetch("/api/user/settings", { cache: "no-store" });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          const message = err?.error || "Failed to load settings";
          setProfileError(message);
          toast.error(message);
          return;
        }

        const data = await res.json();
        const fetchedProfile: UserProfile = {
          firstName: data.profile?.firstName ?? "",
          lastName: data.profile?.lastName ?? "",
          email: data.profile?.email ?? "",
          bio: data.profile?.bio ?? "",
          profilePic: data.profile?.profilePic ?? "",
        };

        setProfile(fetchedProfile);
        setInitialProfile(normalizeProfileValues(fetchedProfile));
      } catch {
        setProfileError("Failed to load settings");
        toast.error("Failed to load settings");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Clear feedback after 3 seconds
  useEffect(() => {
    if (profileSuccess || profileError) {
      const t = setTimeout(() => {
        setProfileSuccess(null);
        setProfileError(null);
      }, 3000);
      return () => clearTimeout(t);
    }
  }, [profileSuccess, profileError]);

  useEffect(() => {
    if (pwSuccess || pwError) {
      const t = setTimeout(() => {
        setPwSuccess(null);
        setPwError(null);
      }, 3000);
      return () => clearTimeout(t);
    }
  }, [pwSuccess, pwError]);

  // Profile update handler with client-side validation
  async function handleProfileUpdate() {
    if (!profile) return;
    const normalized = normalizeProfileValues(profile);
    if (!normalized) return;

    // Client-side Zod validation
    const validationResult = ProfileFormSchema.safeParse({
      firstName: normalized.firstName,
      lastName: normalized.lastName,
      bio: normalized.bio,
    });

    if (!validationResult.success) {
      const errors: Record<string, string> = {};
      validationResult.error.issues.forEach((err: any) => {
        if (err.path[0]) {
          errors[err.path[0].toString()] = err.message;
        }
      });
      setProfileValidationErrors(errors);
      setProfileError("Please fix the validation errors below.");
      toast.error("Please fix the validation errors.");
      return;
    }

    setProfileValidationErrors({});
    setProfileSaving(true);
    setProfileSuccess(null);
    setProfileError(null);
    try {
      const payload: Record<string, unknown> = {
        firstName: normalized.firstName,
        lastName: normalized.lastName,
      };
      if (normalized.bio.length > 0) {
        payload.bio = normalized.bio;
      }

      const res = await fetch("/api/user/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile: payload }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || "Failed to update profile");
      }
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              firstName: normalized.firstName,
              lastName: normalized.lastName,
              bio: normalized.bio,
            }
          : prev
      );
      setInitialProfile(normalized);
      setProfileSuccess("Profile updated successfully!");
      toast.success("Profile updated successfully!");
    } catch (err: any) {
      const message = err?.message || "Could not update profile.";
      setProfileError(message);
      toast.error(message);
    } finally {
      setProfileSaving(false);
    }
  }

  // Password change handler with client-side validation
  async function handlePasswordChange() {
    setPwError(null);
    setPwSuccess(null);
    setPwValidationErrors({});

    // Client-side Zod validation
    const validationResult = PasswordFormSchema.safeParse({
      currentPassword,
      newPassword,
      confirmPassword,
    });

    if (!validationResult.success) {
      const errors: Record<string, string> = {};
      validationResult.error.issues.forEach((err) => {
        if (err.path[0]) {
          errors[err.path[0].toString()] = err.message;
        }
      });
      setPwValidationErrors(errors);
      setPwError("Please fix the validation errors below.");
      toast.error("Please fix the validation errors.");
      return;
    }

    setPwSaving(true);
    try {
      const res = await fetch("/api/user/settings/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || "Failed to change password");
      }
      setPwSuccess("Password changed successfully!");
      toast.success("Password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPwValidationErrors({});
    } catch (err: any) {
      const message = err?.message || "Could not change password.";
      setPwError(message);
      toast.error(message);
    } finally {
      setPwSaving(false);
    }
  }

  async function handleConfirm() {
    if (!activeModal) return;
    try {
      setConfirming(true);
      if (activeModal === "profile") {
        if (!profileValid || !profileDirty) {
          setActiveModal(null);
          return;
        }
        await handleProfileUpdate();
      } else if (activeModal === "password") {
        if (!passwordReady) {
          setActiveModal(null);
          return;
        }
        await handlePasswordChange();
      }
      setActiveModal(null);
    } finally {
      setConfirming(false);
    }
  }

  const normalizedProfile = normalizeProfileValues(profile);
  const profileValid = !!(
    normalizedProfile &&
    normalizedProfile.firstName.length > 0 &&
    normalizedProfile.lastName.length > 0
  );
  const profileDirty = !!(
    normalizedProfile &&
    initialProfile &&
    (
      normalizedProfile.firstName !== initialProfile.firstName ||
      normalizedProfile.lastName !== initialProfile.lastName ||
      normalizedProfile.bio !== initialProfile.bio
    )
  );
  const passwordReady =
    currentPassword.length > 0 &&
    newPassword.length >= 8 &&
    confirmPassword.length >= 8 &&
    newPassword === confirmPassword;

  let content: ReactNode;

  if (loading) {
    content = (
      <div className="max-w-3xl mx-auto flex items-center justify-center min-h-[320px]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-full border-4 border-emerald-200 border-t-emerald-600 animate-spin" />
          <p className="text-sm text-neutral-500 font-medium">Loading your settings...</p>
        </div>
      </div>
    );
  } else if (!profile) {
    content = (
      <div className="max-w-3xl mx-auto">
        <div className="bg-rose-50 border border-rose-200 rounded-2xl px-6 py-8 text-center shadow-sm">
          <p className="text-rose-700 font-semibold mb-2">Unable to load your profile.</p>
          <p className="text-rose-500 text-sm">Please try again later.</p>
        </div>
      </div>
    );
  } else {
    content = (
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Profile Section */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!profileDirty || !profileValid) return;
            setActiveModal("profile");
          }}
          className="bg-white rounded-xl sm:rounded-2xl shadow-lg border-2 border-neutral-200 hover:shadow-xl p-5 sm:p-6 lg:p-7 space-y-5 transition-all duration-200"
        >
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-base sm:text-lg font-bold mb-1 flex items-center gap-2 sm:gap-3 text-neutral-900">
                <span className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 text-white shadow-md ring-2 ring-emerald-100">
                  <HiOutlineUser className="w-5 h-5 sm:w-6 sm:h-6" />
                </span>
                Profile Information
              </h2>
              <p className="text-xs sm:text-sm text-neutral-600 mb-2">Update the basic details that help personalize your FoodFindr experience.</p>
            </div>
            {profileDirty && (
              <button
                type="button"
                onClick={() => {
                  if (!initialProfile) return;
                  setProfile({
                    firstName: initialProfile.firstName,
                    lastName: initialProfile.lastName,
                    email: initialProfile.email,
                    bio: initialProfile.bio,
                    profilePic: initialProfile.profilePic,
                  });
                  toast.info("Changes discarded");
                }}
                className="flex items-center gap-1 text-xs text-neutral-500 hover:text-rose-600 transition px-2 py-1 rounded hover:bg-rose-50"
                title="Discard changes"
              >
                <HiOutlineXMark className="w-3.5 h-3.5" />
                Discard
              </button>
            )}
          </div>

          {/* Avatar Upload */}
          <AvatarUploader
            currentUrl={profile.profilePic || ""}
            onUrlChange={(url) => {
              setProfile({ ...profile, profilePic: url });
              setInitialProfile((prev) => (prev ? { ...prev, profilePic: url } : prev));
            }}
          />

          {/* Name fields */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-1.5 text-neutral-800">
                  First Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  className={`w-full border rounded-lg px-3 py-2.5 text-sm text-neutral-900 focus:outline-none focus:ring-2 transition-all ${
                    profileValidationErrors.firstName
                      ? "border-rose-300 focus:ring-rose-200 focus:border-rose-400"
                      : "border-neutral-200 focus:ring-emerald-200 focus:border-emerald-300"
                  }`}
                  value={profile.firstName || ""}
                  onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                  placeholder="Enter your first name"
                  required
                />
                {profileValidationErrors.firstName && (
                  <p className="text-xs text-rose-600 mt-1 flex items-center gap-1">
                    <HiOutlineExclamationCircle className="w-3.5 h-3.5" />
                    {profileValidationErrors.firstName}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5 text-neutral-800">
                  Last Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  className={`w-full border rounded-lg px-3 py-2.5 text-sm text-neutral-900 focus:outline-none focus:ring-2 transition-all ${
                    profileValidationErrors.lastName
                      ? "border-rose-300 focus:ring-rose-200 focus:border-rose-400"
                      : "border-neutral-200 focus:ring-emerald-200 focus:border-emerald-300"
                  }`}
                  value={profile.lastName || ""}
                  onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                  placeholder="Enter your last name"
                  required
                />
                {profileValidationErrors.lastName && (
                  <p className="text-xs text-rose-600 mt-1 flex items-center gap-1">
                    <HiOutlineExclamationCircle className="w-3.5 h-3.5" />
                    {profileValidationErrors.lastName}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Email - Read-only with clear visual distinction */}
          <div>
            <label className="block text-sm font-semibold mb-1.5 text-neutral-800 flex items-center gap-2">
              Email
              <span className="text-xs font-normal text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded">Read-only</span>
            </label>
            <input
              type="email"
              className="w-full border border-neutral-200 rounded-lg px-3 py-2.5 text-sm bg-neutral-50 text-neutral-600 cursor-not-allowed focus:outline-none"
              value={profile.email}
              disabled
            />
            <p className="text-xs text-neutral-500 mt-1 flex items-center gap-1">
              <HiOutlineInformationCircle className="w-3.5 h-3.5" />
              Your email cannot be changed for security reasons
            </p>
          </div>

          {/* Bio - Miller's Law (keep it simple, character counter for feedback) */}
          <div>
            <label className="block text-sm font-semibold mb-1.5 text-neutral-800">
              Bio
              <span className="text-xs font-normal text-neutral-500 ml-2">Optional</span>
            </label>
            <textarea
              className={`w-full border rounded-lg px-3 py-2.5 text-sm text-neutral-900 focus:outline-none focus:ring-2 transition-all resize-none ${
                profileValidationErrors.bio
                  ? "border-rose-300 focus:ring-rose-200 focus:border-rose-400"
                  : "border-neutral-200 focus:ring-emerald-200 focus:border-emerald-300"
              }`}
              value={profile.bio || ""}
              onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
              rows={3}
              maxLength={280}
              placeholder="Tell us a bit about yourself..."
            />
            <div className="flex items-center justify-between mt-1">
              {profileValidationErrors.bio ? (
                <p className="text-xs text-rose-600 flex items-center gap-1">
                  <HiOutlineExclamationCircle className="w-3.5 h-3.5" />
                  {profileValidationErrors.bio}
                </p>
              ) : (
                <p className="text-xs text-neutral-500">Share your story, interests, or cooking style</p>
              )}
              <span className={`text-xs font-medium ${
                (profile.bio || "").length > 250 ? "text-amber-600" : "text-neutral-400"
              }`}>
                {(profile.bio || "").length}/280
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              className="inline-flex items-center justify-center bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold text-sm py-2.5 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-emerald-600 disabled:hover:to-teal-600 min-h-[44px]"
              disabled={profileSaving || !profileDirty || !profileValid}
            >
              {profileSaving ? (
                <>
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </button>
            {!profileDirty && !profileSaving && (
              <span className="flex items-center gap-1 text-xs text-neutral-400">
                <HiOutlineInformationCircle className="w-3.5 h-3.5" />
                No changes to save
              </span>
            )}
          </div>
          {profileSuccess && (
            <div className="mt-2 text-emerald-600 flex items-center gap-1 text-sm">
              <HiOutlineCheckCircle /> {profileSuccess}
            </div>
          )}
          {profileError && (
            <div className="mt-2 text-rose-600 flex items-center gap-1 text-sm">
              <HiOutlineExclamationCircle /> {profileError}
            </div>
          )}
        </form>

        {/* Password Section */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!passwordReady) return;
            setActiveModal("password");
          }}
          className="bg-white rounded-xl sm:rounded-2xl shadow-lg border-2 border-neutral-200 hover:shadow-xl p-5 sm:p-6 lg:p-7 space-y-5 transition-all duration-200"
        >
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-base sm:text-lg font-bold mb-1 flex items-center gap-2 sm:gap-3 text-neutral-900">
                <span className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl bg-gradient-to-br from-rose-400 to-rose-600 text-white shadow-md ring-2 ring-rose-100">
                  <HiOutlineLockClosed className="w-5 h-5 sm:w-6 sm:h-6" />
                </span>
                Change Password
              </h2>
              <p className="text-xs sm:text-sm text-neutral-600 mb-2">Keep your account secure by using a strong, unique password.</p>
            </div>
            {(currentPassword || newPassword || confirmPassword) && (
              <button
                type="button"
                onClick={() => {
                  setCurrentPassword("");
                  setNewPassword("");
                  setConfirmPassword("");
                  setPwError(null);
                  toast.info("Password fields cleared");
                }}
                className="flex items-center gap-1 text-xs text-neutral-500 hover:text-rose-600 transition px-2 py-1 rounded hover:bg-rose-50"
                title="Clear fields"
              >
                <HiOutlineXMark className="w-3.5 h-3.5" />
                Clear
              </button>
            )}
          </div>
          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1 text-neutral-800">Current Password</label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? "text" : "password"}
                  autoComplete="current-password"
                  className="w-full border border-neutral-200 rounded-lg px-3 py-2 pr-10 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  disabled={pwSaving}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                  disabled={pwSaving}
                >
                  {showCurrentPassword ? <HiOutlineEyeSlash className="w-5 h-5" /> : <HiOutlineEye className="w-5 h-5" />}
                </button>
              </div>
              {pwValidationErrors.currentPassword && (
                <p className="text-xs text-rose-600 mt-1">{pwValidationErrors.currentPassword}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1 text-neutral-800">New Password</label>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  autoComplete="new-password"
                  className="w-full border border-neutral-200 rounded-lg px-3 py-2 pr-10 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                  disabled={pwSaving}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                  disabled={pwSaving}
                >
                  {showNewPassword ? <HiOutlineEyeSlash className="w-5 h-5" /> : <HiOutlineEye className="w-5 h-5" />}
                </button>
              </div>
              {pwValidationErrors.newPassword && (
                <p className="text-xs text-rose-600 mt-1">{pwValidationErrors.newPassword}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1 text-neutral-800">Confirm New Password</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  className="w-full border border-neutral-200 rounded-lg px-3 py-2 pr-10 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={8}
                  disabled={pwSaving}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                  disabled={pwSaving}
                >
                  {showConfirmPassword ? <HiOutlineEyeSlash className="w-5 h-5" /> : <HiOutlineEye className="w-5 h-5" />}
                </button>
              </div>
              {pwValidationErrors.confirmPassword && (
                <p className="text-xs text-rose-600 mt-1">{pwValidationErrors.confirmPassword}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              className="inline-flex items-center justify-center bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white font-semibold text-sm py-2.5 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-rose-600 disabled:hover:to-rose-700 min-h-[44px]"
              disabled={pwSaving || !passwordReady}
            >
              {pwSaving ? (
                <>
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  Changing...
                </>
              ) : (
                "Change Password"
              )}
            </button>
            {!passwordReady && !pwSaving && (
              <span className="flex items-center gap-1 text-xs text-neutral-400">
                <HiOutlineInformationCircle className="w-3.5 h-3.5" />
                {!currentPassword && !newPassword ? "Fill in all fields" : "Passwords must match (8+ chars)"}
              </span>
            )}
          </div>
          {pwSuccess && (
            <div className="mt-2 text-emerald-600 flex items-center gap-1 text-sm">
              <HiOutlineCheckCircle /> {pwSuccess}
            </div>
          )}
          {pwError && (
            <div className="mt-2 text-rose-600 flex items-center gap-1 text-sm">
              <HiOutlineExclamationCircle /> {pwError}
            </div>
          )}
        </form>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden relative bg-white">
      {/* Background image with subtle overlay */}
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        aria-hidden="true"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1504674900247-344454492b37?w=1600&q=80&auto=format&fit=crop')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          opacity: 0.08,
          filter: "brightness(1)",
        }}
      />

      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main className="flex-1 h-full overflow-y-auto relative z-10">
        <div className="h-full w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10 max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8 sm:mb-10">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-4">
              <div className="flex items-center justify-center h-14 w-14 sm:h-16 sm:w-16 rounded-2xl bg-gradient-to-br from-emerald-400 via-emerald-500 to-teal-600 shadow-lg ring-2 ring-emerald-100">
                <HiOutlineUser className="h-7 w-7 sm:h-8 sm:w-8 text-white" />
              </div>
              <div className="flex-1">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-neutral-900 tracking-tight mb-1">
                  Account Settings
                </h1>
                <p className="text-neutral-600 text-sm sm:text-base">
                  Manage your profile and security{session?.user?.name ? `, ${firstName}` : ""}.
                </p>
              </div>
            </div>
          </div>

          {content}
        </div>
      </main>
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 sm:p-8 animate-in zoom-in-95 duration-200">
            <h3 className="text-lg sm:text-xl font-bold text-neutral-900 mb-2">
              {activeModal === "profile" && "Update Profile"}
              {activeModal === "password" && "Change Password"}
            </h3>
            <p className="text-sm text-neutral-600 mb-6">
              {activeModal === "profile" && "Are you sure you want to update your public profile details?"}
              {activeModal === "password" &&
                "Are you sure you want to change your password? You will need to log in again on other devices."}
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                className="px-4 py-2.5 rounded-xl border-2 border-neutral-200 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 hover:border-neutral-300 transition-all active:scale-95 min-h-[44px]"
                onClick={() => setActiveModal(null)}
                disabled={confirming}
              >
                Cancel
              </button>
              <button
                type="button"
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-sm font-semibold shadow-lg hover:shadow-xl transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed min-h-[44px]"
                onClick={handleConfirm}
                disabled={confirming}
              >
                {confirming ? (
                  <span className="flex items-center gap-2">
                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Confirming...
                  </span>
                ) : (
                  "Confirm"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}