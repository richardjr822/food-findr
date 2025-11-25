import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import type { Metadata } from "next";
import { getAuthenticatedUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "Account Settings | FoodFindr",
  description: "Manage your FoodFindr account settings, profile, privacy, and security preferences.",
};

export default async function SettingsLayout({ children }: { children: ReactNode }) {
  const user = await getAuthenticatedUser();
  if (!user) {
    redirect("/auth/login?callbackUrl=/settings");
  }
  return <>{children}</>;
}
