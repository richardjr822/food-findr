    import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { getAuthenticatedUser } from "@/lib/session";

export default async function SettingsLayout({ children }: { children: ReactNode }) {
  const user = await getAuthenticatedUser();
  if (!user) {
    redirect("/auth/login?callbackUrl=/settings");
  }
  return <>{children}</>;
}
