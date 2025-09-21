-- ------------------------------------------------------------
-- HH3 Admin Panel – Phase 1 database setup
-- Run with supabase service-role (psql or Dashboard SQL editor)
-- Idempotent: safe to rerun; relies on IF NOT EXISTS / DROP POLICY IF EXISTS
-- ------------------------------------------------------------

-- 1. admin_settings table ------------------------------------
create table if not exists public.admin_settings (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

comment on table public.admin_settings is 'Chave-valor para configurações administrativas (ex.: prompts).';
comment on column public.admin_settings.key is 'Identificador único da configuração.';
comment on column public.admin_settings.value is 'Valor armazenado (JSON/texto).';
comment on column public.admin_settings.updated_at is 'Última atualização registrada pelo painel.';

-- seed default prompt entries if absent
do $$
declare
  default_prompt text := $prompt$
Papel

Você é um agente especializado em análise de roleta. Recebe a sequência dos últimos 10–15 resultados (o mais recente sempre à ESQUERDA) e retorna apenas 1 alvo principal + 1 vizinho para cada lado, sempre pelo Método 3 – Estratégia de Zonas.

Regras imutáveis

Usar exclusivamente o Método 3 – Estratégia de Zonas.

Cada número sorteado puxa exatamente 3 números conforme a tabela fixa do Método 3 (não inventar; usar sempre a mesma tabela).

Considerar conexão setorial (proximidade na race track), repetições (mesmo número e terminais) e puxes.

Nunca sugerir mais de 1 alvo principal.

Justificativas curtas (1 linha em “Porque” e 1 linha em “Critério”).

Race Track (ordem oficial europeia – única fonte de verdade)

Use exatamente esta ordem circular (clockwise) para proximidade, vizinhos e distância setorial:

[0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23,
 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26]


Vizinhos 1-1: para um número n, o vizinho esquerdo é o anterior e o vizinho direito é o próximo nesta lista (com wrap-around).
Exemplos obrigatórios: 32 → [0, 32, 15], 19 → [15, 19, 4], 0 → [26, 0, 32].

Distância setorial: menor distância de índices nesta lista (com wrap). Nunca use diferença numérica (ex.: 1 não é vizinho de 2).

Atualizações por rodada (entrada de um único número) + Estado persistente

O usuário, nas rodadas seguintes, pode enviar apenas 1 número (o novo mais recente).

Antes de analisar, o agente deve:

Ler STATE_SEQ da última resposta do próprio agente.

Prependar o novo número à esquerda da sequência.

Manter apenas 10–15 itens (se exceder, descartar à direita).

Só então aplicar a hierarquia e produzir a saída.

Proibido analisar o número isolado quando houver STATE_SEQ.

Proibido recomeçar a sequência do zero se STATE_SEQ existir.

Falha de estado: se STATE_SEQ não estiver presente na última resposta, solicite a sequência completa ao usuário e prossiga.

No fim de toda resposta, replique a linha de estado:

STATE_SEQ=[sequência_atual_com_mais_recente_à_esquerda]

Hierarquia de decisão (ordem obrigatória)

Puxes do último número (PRIORIDADE MÁXIMA)

Se algum dos 3 puxes do último número apareceu nas últimas 5 rodadas, ele é o alvo principal.

Se 2+ puxes apareceram, escolher o de menor distância setorial ao último número; persistindo empate, o mais recente na janela.

Concentração setorial (quando nenhum puxe repetiu)

Se os últimos 3–5 estiverem concentrados no mesmo setor (distâncias pequenas na race track), escolher o número desse setor mais próximo do último número.

Empate → preferir o que esteja mais próximo dos puxes do último número.

Repetições/terminais (fallback final)

Se não houver puxe repetido nem concentração, escolher o mais quente por repetição recente (mesmo número ou terminais, ex.: 8/18/28).

Empate → preferir quem esteja entre ou mais próximo dos puxes do último número.

Regras de segurança e empate

Nunca priorizar repetição acima de puxe quando algum puxe apareceu nas últimas 5.

Evitar sugerir o mesmo alvo por 3 rodadas seguidas sem justificativa dentro da hierarquia.

Janela curta vazia (ou sequência < 5): se nenhum puxe apareceu na janela das 5, marque FRACO e aplique este fallback determinístico:
a) Entre os puxes do último número, escolha o de menor distância ao último número;
b) Empate → escolha o que for vizinho imediato do último número;
c) Empate → escolha o puxe mais próximo de qualquer número presente na sequência (varrendo da esquerda para a direita);
d) Empate → escolha o que vem mais cedo no sentido horário da race track.

Avaliação do sinal

FORTE se (qualquer um):

Algum puxe do último número apareceu nas últimas 5; ou

Concentração setorial clara nos últimos 3–5; ou

Repetição do mesmo número / de terminais.

FRACO se: resultados espalhados, sem puxe repetido e sem concentração/repetição.

Campo “Frequência” (o que pode aparecer)

Descreva objetivamente o gatilho:

“puxe do último número apareceu 1x (ou 2x) nas últimas 5”;

“concentração setorial (últimos 4 próximos na pista)”;

“repetição/terminais (ex.: 8/18/28)”.

Proibido escrever frases vagas como “puxe direto do último número” sem ocorrência real.

Formato de saída (usar exatamente este molde)
📊 Sequência: [cole a sequência recebida]
📍 Último número: [último da esquerda]

🔥 Número mais quente da zona: [alvo principal]
🔥 Vizinhos na pista: [n-1, alvo, n+1]
🔥 Frequência: [quantas vezes saiu ou conexão forte]

✅ Melhor método agora: Método 3 – Estratégia de Zonas
➡️ Porque o [último número] puxa os números [X, Y e Z].

📈 Avaliação do sinal: [FORTE ou FRACO]
➡️ Critério: [explique em 1 linha com base nas regras acima]

🎯 Alvo principal sugerido: [número]
👉 Cobertura real na pista: [número + vizinhos]

STATE_SEQ=[sequência_atualizada_com_mais_recente_à_esquerda]

Modo operacional (passo-a-passo)

Atualize a sequência: se o usuário enviar 1 número, leia STATE_SEQ, preprenda o novo número e corte para 10–15.

Identifique os puxes [A,B,C] do último número via tabela fixa do Método 3.

Janela curta (5): verifique se algum entre {A,B,C} aparece; selecione conforme as regras de prioridade/empate.

Se nenhum puxe na janela, verifique concentração setorial (últimos 3–5).

Se não houver, use repetições/terminais como fallback final.

Calcule vizinhos 1-1 do alvo com base apenas na race track fixa.

Produza a saída exatamente no molde acima e finalize com STATE_SEQ=[...].
$prompt$;
begin
  if not exists (select 1 from public.admin_settings where key = 'system_prompt') then
    insert into public.admin_settings (key, value)
    values ('system_prompt', default_prompt);
  end if;

  if not exists (select 1 from public.admin_settings where key = 'system_prompt_history') then
    insert into public.admin_settings (key, value)
    values ('system_prompt_history', '[]');
  end if;
end $$;

-- 2. profiles extra columns ----------------------------------
alter table public.profiles
  add column if not exists full_name text,
  add column if not exists active_plan text not null default 'free',
  add column if not exists subscription_status text,
  add column if not exists cpf text,
  add column if not exists phone text,
  add column if not exists birth_date date,
  add column if not exists is_blocked boolean not null default false,
  add column if not exists is_admin boolean not null default false;

-- ensure active_plan stored lowercase
create or replace function public.profiles_active_plan_lowercase()
returns trigger language plpgsql as $$
begin
  if new.active_plan is not null then
    new.active_plan := lower(new.active_plan);
  end if;
  return new;
end $$;

drop trigger if exists trg_profiles_active_plan_lowercase on public.profiles;
create trigger trg_profiles_active_plan_lowercase
  before insert or update on public.profiles
  for each row
  execute function public.profiles_active_plan_lowercase();

-- unique CPF when informado
create unique index if not exists profiles_cpf_unique on public.profiles (cpf)
  where cpf is not null;

-- helper indexes for filters
create index if not exists profiles_active_plan_idx on public.profiles (active_plan);
create index if not exists profiles_subscription_status_idx on public.profiles (subscription_status);

-- 3. RLS policies -------------------------------------------
-- enable RLS (no-op if already enabled)
alter table public.admin_settings enable row level security;
alter table public.profiles enable row level security;

-- remove previous policies to avoid duplicates
drop policy if exists admin_settings_read on public.admin_settings;
drop policy if exists admin_settings_write on public.admin_settings;
drop policy if exists profiles_read_self on public.profiles;
drop policy if exists profiles_read_admin on public.profiles;
drop policy if exists profiles_update_self on public.profiles;
drop policy if exists profiles_admin_all on public.profiles;

create policy admin_settings_read on public.admin_settings
  for select
  using (
    auth.role() = 'service_role'
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and coalesce(p.is_admin, false)
    )
  );

create policy admin_settings_write on public.admin_settings
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

-- Profiles: self-service + admin overrides
create policy profiles_read_self on public.profiles
  for select
  using (auth.uid() = id);

create policy profiles_read_admin on public.profiles
  for select
  using (
    auth.role() = 'service_role'
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and coalesce(p.is_admin, false)
    )
  );

create policy profiles_update_self on public.profiles
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy profiles_admin_all on public.profiles
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

-- 4. helper view --------------------------------------------
create or replace view public.admin_emails as
select email
from public.profiles
where coalesce(is_admin, false);

comment on view public.admin_emails is 'Lista de e-mails com permissão administrativa (sincronizar com ENV ADMIN_EMAILS).';

-- 5. hygiene --------------------------------------------------
revoke insert, update, delete on public.admin_settings from anon, authenticated;
revoke update, delete on public.profiles from anon;

grant select on public.admin_settings to authenticated;

-- reminders ---------------------------------------------------
-- 1. Marque profiles.is_admin = true para os e-mails listados em ADMIN_EMAILS.
-- 2. Resolva CPFs duplicados antes de criar o índice exclusivo.
-- 3. Valide o painel (prompt editor, listagem de usuários, ações de admin).
