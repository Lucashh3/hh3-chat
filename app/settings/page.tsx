import { redirect } from "next/navigation";

import { SettingsClient } from "./settings-client";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { fetchPlanById } from "@/lib/plan-service";

export default async function SettingsPage() {
  const supabase = createServerSupabaseClient();
  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/auth/login?redirectTo=/settings");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, active_plan, subscription_status, email, cpf, phone, birth_date")
    .eq("id", session.user.id)
    .maybeSingle();

  const plan = profile ? await fetchPlanById(profile.active_plan) : null;

  const metadataFullName =
    typeof session.user.user_metadata?.full_name === "string"
      ? (session.user.user_metadata.full_name as string)
      : null;

  const safeProfile = profile
    ? {
        full_name: profile.full_name,
        active_plan: profile.active_plan,
        subscription_status: profile.subscription_status,
        email: profile.email,
        cpf: profile.cpf,
        phone: profile.phone,
        birth_date: profile.birth_date
      }
    : {
        full_name: metadataFullName,
        active_plan: "free",
        subscription_status: null,
        email: session.user.email ?? null,
        cpf: null,
        phone: null,
        birth_date: null
      };

  return (
    <SettingsClient
      plan={plan ?? null}
      profile={safeProfile}
      userEmail={session.user.email ?? null}
      userCreatedAt={session.user.created_at ?? null}
    />
  );
}
