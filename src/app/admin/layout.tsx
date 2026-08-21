import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const staffRoles = new Set(["super_admin", "compliance", "operations", "support"]);

export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in?next=/admin");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !staffRoles.has(profile.role)) {
    redirect("/portal");
  }

  return children;
}
