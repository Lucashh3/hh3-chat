-- ------------------------------------------------------------
-- HH3 Admin Panel – Phase 3 insights setup
-- Adds prompt usage logging + Stripe webhook audit trail
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

-- 2. stripe_webhook_events -----------------------------------
create table if not exists public.stripe_webhook_events (
  id uuid primary key default gen_random_uuid(),
  stripe_event_id text unique,
  type text not null,
  status text not null,
  error_message text,
  payload jsonb,
  received_at timestamptz not null default now(),
  processed_at timestamptz
);

create index if not exists stripe_webhook_events_type_idx on public.stripe_webhook_events (type);
create index if not exists stripe_webhook_events_received_idx on public.stripe_webhook_events (received_at desc);

alter table public.stripe_webhook_events enable row level security;

drop policy if exists stripe_events_admin_all on public.stripe_webhook_events;

create policy stripe_events_admin_all on public.stripe_webhook_events
  for all
  using (
    auth.role() = 'service_role'
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and coalesce(p.is_admin, false)
    )
  );

-- 3. helper view for aggregated metrics ----------------------
create or replace view public.prompt_usage_daily as
select
  date_trunc('day', created_at) as day,
  count(*) as total_calls,
  avg(duration_ms) as avg_duration_ms,
  sum(case when success then 1 else 0 end) as success_calls,
  sum(case when success then 0 else 1 end) as failed_calls
from public.prompt_usage_logs
where created_at >= now() - interval '60 days'
group by 1
order by 1 desc;

comment on view public.prompt_usage_daily is 'Resumo diário das chamadas ao motor DeepSeek (últimos 60 dias).';

create or replace view public.profiles_signups_daily as
select
  date_trunc('day', p.created_at) as day,
  count(*) as total_signups,
  count(*) filter (
    where coalesce(pl.price_monthly, 0) > 0
       or coalesce(pl.price_yearly, 0) > 0
  ) as paid_signups
from public.profiles p
left join public.plans pl on pl.id = p.active_plan
where p.created_at >= now() - interval '60 days'
group by 1
order by 1 desc;

comment on view public.profiles_signups_daily is 'Novos cadastros por dia (últimos 60 dias) e quantos chegaram em planos pagos.';

create or replace view public.chat_activity_daily as
select
  date_trunc('day', created_at) as day,
  count(*) filter (where role = 'user') as user_messages,
  count(*) filter (where role = 'assistant') as assistant_messages
from public.chats
where created_at >= now() - interval '60 days'
group by 1
order by 1 desc;

comment on view public.chat_activity_daily is 'Resumo diário de mensagens enviadas (usuário x HH3) nos últimos 60 dias.';

create or replace view public.stripe_webhook_status as
select
  type,
  count(*) filter (where status = 'processed') as processed,
  count(*) filter (where status = 'error') as errors,
  max(received_at) as last_received,
  max(processed_at) filter (where status = 'processed') as last_processed
from public.stripe_webhook_events
where received_at >= now() - interval '30 days'
group by 1;

comment on view public.stripe_webhook_status is 'Visão geral recente dos webhooks Stripe.';

-- 4. privileges ----------------------------------------------
revoke all on public.prompt_usage_logs from anon, authenticated;
revoke all on public.stripe_webhook_events from anon, authenticated;

grant select on public.prompt_usage_logs to authenticated;
grant select on public.stripe_webhook_events to authenticated;

-- lembrar: vincular profiles.is_admin com ADMIN_EMAILS para os acessos funcionar.
