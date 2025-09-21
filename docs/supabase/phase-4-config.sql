-- ------------------------------------------------------------
-- HH3 Admin Panel – Phase 4 configuration setup
-- Creates dynamic plans + multi-prompt storage
-- Run with service-role privileges
-- ------------------------------------------------------------

-- 1. plans table ------------------------------------------------
create table if not exists public.plans (
  id text primary key,
  name text not null,
  description text not null,
  price_monthly numeric not null default 0,
  price_yearly numeric,
  stripe_price_id text,
  features text[] not null default '{}',
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists plans_is_active_idx on public.plans (is_active) where is_active = true;
create index if not exists plans_sort_idx on public.plans (sort_order asc);

create or replace function public.plans_set_timestamp()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_plans_set_timestamp on public.plans;
create trigger trg_plans_set_timestamp
  before update on public.plans
  for each row
  execute function public.plans_set_timestamp();

-- seed default plans if table empty (free/pro/vip)
do $$
declare
  existing integer;
begin
  select count(*) into existing from public.plans;
  if existing = 0 then
    insert into public.plans (id, name, description, price_monthly, price_yearly, stripe_price_id, features, sort_order)
    values
      (
        'free',
        'Iniciante HH3',
        'Entre no método HH3 com leituras guiadas limitadas por dia.',
        0,
        0,
        null,
        array['2 leituras de sequência por dia', 'Resumo interativo do Método 3', 'Histórico básico salvo por 24h'],
        0
      ),
      (
        'pro',
        'Mentoria Pro',
        'Mentoria contínua com HH3 para executar o Método 3 sem atrasos.',
        29,
        290,
        coalesce(nullif(current_setting('app.stripe_pro_price_id', true), ''), 'price_pro_placeholder'),
        array['Leituras ilimitadas da roleta europeia', 'Avaliação de sinal com vizinhos sugeridos', 'Histórico completo e plano de banca semanal'],
        1
      ),
      (
        'vip',
        'Mentoria Elite',
        'Acesso direto ao HH3 com relatórios e suporte prioritário.',
        79,
        790,
        coalesce(nullif(current_setting('app.stripe_vip_price_id', true), ''), 'price_vip_placeholder'),
        array['Sessões de ajuste individual com HH3', 'Relatórios avançados do desempenho por zona', 'Suporte dedicado para sessões ao vivo'],
        2
      );
  end if;
end $$;

alter table public.plans enable row level security;

drop policy if exists plans_admin_all on public.plans;
create policy plans_admin_all on public.plans
  for all
  using (
    auth.role() = 'service_role'
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and coalesce(p.is_admin, false)
    )
  )
  with check (
    auth.role() = 'service_role'
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and coalesce(p.is_admin, false)
    )
  );

-- 2. admin_prompts table ----------------------------------------
create table if not exists public.admin_prompts (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  value text not null,
  history jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.admin_prompts add constraint admin_prompts_type_key unique (type);

create or replace function public.admin_prompts_set_timestamp()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_admin_prompts_timestamp on public.admin_prompts;
create trigger trg_admin_prompts_timestamp
  before update on public.admin_prompts
  for each row
  execute function public.admin_prompts_set_timestamp();

-- seed default prompt records if absent
with defaults as (
  select * from (values
    ('system', current_setting('app.prompt_system', true)),
    ('fallback', current_setting('app.prompt_fallback', true)),
    ('onboarding', current_setting('app.prompt_onboarding', true))
  ) as t(type, value)
)
insert into public.admin_prompts (type, value)
select type, coalesce(nullif(value, ''), '')
from defaults
where type not in (select type from public.admin_prompts);

alter table public.admin_prompts enable row level security;

drop policy if exists admin_prompts_admin_all on public.admin_prompts;
create policy admin_prompts_admin_all on public.admin_prompts
  for all
  using (
    auth.role() = 'service_role'
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and coalesce(p.is_admin, false)
    )
  )
  with check (
    auth.role() = 'service_role'
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and coalesce(p.is_admin, false)
    )
  );

-- 3. helper view for active plans -------------------------------
create or replace view public.active_plans as
select id, name, description, price_monthly, price_yearly, stripe_price_id, features, sort_order, is_active, updated_at
from public.plans
where is_active = true
order by sort_order asc, updated_at desc;

comment on view public.active_plans is 'Planos ativos ordenados para exposição no app.';

-- 4. privileges --------------------------------------------------
revoke all on public.admin_prompts from anon, authenticated;
revoke all on public.plans from anon, authenticated;

grant select on public.active_plans to authenticated;

-- Notas:
-- - configure GUCs opcionais (app.stripe_pro_price_id / app.stripe_vip_price_id) para preencher IDs padrão
-- - mantenha admin_prompts sincronizado com novos tipos adicionados no app
