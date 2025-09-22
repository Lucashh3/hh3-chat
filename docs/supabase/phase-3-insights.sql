-- ------------------------------------------------------------
-- HH3 Admin Panel – Phase 3 insights setup (sem integrações externas)
-- Adiciona logging básico de uso do prompt
-- Run with service-role privileges
-- ------------------------------------------------------------

-- 1. prompt_usage_logs ----------------------------------------
create table if not exists public.prompt_usage_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  session_id uuid references public.chat_sessions(id) on delete set null,
  duration_ms integer,
  success boolean not null default true,
  error_text text,
  created_at timestamptz not null default now()
);

create index if not exists prompt_usage_logs_user_id_idx on public.prompt_usage_logs (user_id);
create index if not exists prompt_usage_logs_created_at_idx on public.prompt_usage_logs (created_at);

alter table public.prompt_usage_logs enable row level security;

drop policy if exists prompt_logs_admin_all on public.prompt_usage_logs;

create policy prompt_logs_admin_all on public.prompt_usage_logs
  for all
  using (
    auth.role() = 'service_role'
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and coalesce(p.is_admin, false)
    )
  );

-- 2. helper view para métricas ----------------------
create or replace view public.prompt_usage_daily as
select
  date_trunc('day', created_at) as day,
  count(*) as total_calls,
  avg(duration_ms) as avg_duration_ms,
  sum(case when success then 1 else 0 end) as success_calls,
  sum(case when success then 0 else 1 end) as failed_calls
from public.prompt_usage_logs
where created_at >= now() - interval '60 days'
order by 1 desc;

comment on view public.prompt_usage_daily is 'Resumo diário das chamadas ao motor DeepSeek (últimos 60 dias).';

-- 3. privileges ----------------------------------------------
revoke all on public.prompt_usage_logs from anon, authenticated;

grant select on public.prompt_usage_logs to authenticated;

-- lembrar: vincular profiles.is_admin com ADMIN_EMAILS para os acessos funcionar.
