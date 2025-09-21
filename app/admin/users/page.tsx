import { notFound } from "next/navigation";

import { UsersTable, type AdminUserRow } from "@/components/admin/users-table";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const PAGE_SIZE = 20;

export default async function AdminUsersPage({
  searchParams
}: {
  searchParams?: Record<string, string | string[]>;
}) {
  const supabase = createServerSupabaseClient();
  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (!session) {
    notFound();
  }

  const pageParam = Array.isArray(searchParams?.page) ? searchParams?.page[0] : searchParams?.page;
  const queryParam = Array.isArray(searchParams?.q) ? searchParams?.q[0] : searchParams?.q;

  const page = Math.max(1, Number(pageParam) || 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const baseQuery = supabase
    .from("profiles")
    .select("id, full_name, email, active_plan, subscription_status, cpf, phone, birth_date, created_at", {
      count: "exact"
    })
    .order("created_at", { ascending: false })
    .range(from, to);

  const query = queryParam?.trim();
  if (query) {
    baseQuery.or(
      `email.ilike.%${query}%,full_name.ilike.%${query}%,cpf.ilike.%${query}%,phone.ilike.%${query}%`
    );
  }

  const { data: profiles, error, count } = await baseQuery;

  if (error) {
    console.error(error);
    notFound();
  }

  const users: AdminUserRow[] = (profiles ?? []).map((user) => ({
    id: user.id,
    full_name: user.full_name,
    email: user.email,
    active_plan: user.active_plan,
    subscription_status: user.subscription_status,
    cpf: user.cpf,
    phone: user.phone,
    birth_date: user.birth_date,
    created_at: user.created_at,
    chat_count: 0,
    last_chat_at: null
  }));

  if (users.length) {
    const userIds = users.map((user) => user.id);
    const { data: sessionsData } = await supabase
      .from("chat_sessions")
      .select("user_id, updated_at")
      .in("user_id", userIds);

    if (sessionsData) {
      const grouped = sessionsData.reduce<Record<string, { chatCount: number; lastChatAt: string | null }>>(
        (acc, current) => {
          const entry = acc[current.user_id] ?? { chatCount: 0, lastChatAt: null };
          entry.chatCount += 1;
          if (!entry.lastChatAt || new Date(current.updated_at) > new Date(entry.lastChatAt)) {
            entry.lastChatAt = current.updated_at;
          }
          acc[current.user_id] = entry;
          return acc;
        },
        {}
      );

      users.forEach((user) => {
        const stats = grouped[user.id];
        if (stats) {
          user.chat_count = stats.chatCount;
          user.last_chat_at = stats.lastChatAt;
        }
      });
    }
  }

  return (
    <div className="space-y-6 px-4 py-6 sm:px-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">Usuários</h1>
        <p className="text-sm text-muted-foreground">
          Pesquise, filtre e acompanhe o status dos clientes que utilizam o HH3.
        </p>
      </div>

      <UsersTable
        users={users}
        total={count ?? 0}
        page={page}
        pageSize={PAGE_SIZE}
        query={query ?? ""}
      />
    </div>
  );
}
