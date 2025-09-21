# Plano de Evolução do Painel Admin

## Visão Geral
- Roadmap organizado em fases progressivas; manter checklist viva a cada iteração.
- Atualizar este arquivo sempre que uma entrega for concluída ou requisitos mudarem.

## Fase 1 – Fundamentos (Prioridade Alta)
- [x] Layout reutilizável com sidebar/topbar (`app/admin/layout.tsx`).
- [x] Página de visão geral integrada ao layout e com cards principais (`app/admin/page.tsx`).
- [x] Prompt editor com histórico, botão "voltar ao padrão" e fallback robusto.
- [x] Scripts Supabase (tabela `admin_settings`, colunas extras em `profiles`, CPF único, políticas RLS revisadas).

**Próximas ações sugeridas**
- Executar `docs/supabase/phase-1-initial-setup.sql` no projeto Supabase.
- Marcar `profiles.is_admin = true` para os e-mails listados em `ADMIN_EMAILS` após rodar o script.

## Fase 2 – Gestão de Usuários
- [x] Tabela paginada com filtros (nome/e-mail/CPF) exibindo plano, status e criação (`app/admin/users/page.tsx`).
- [x] Ficha lateral como painel deslizante com dados completos e histórico de chats.
- [x] Ações administrativas: reset de senha, alterar plano manualmente, bloquear/desbloquear, exportar CSV.
- [x] Links para abrir chats (`/chat?chatId=...`) a partir da lista detalhada.

**Próximas ações sugeridas**
- Monitorar performance da listagem ao usar drawers (eventuais otimizações de paginação server-side).
- Registrar logs de auditoria na próxima fase para acompanhar ações críticas.

## Fase 3 – Insights e Métricas
- [x] Gráficos de evolução (novos usuários/dia, conversão, picos de uso).
- [x] Métricas de uso do prompt (contagem, latência, falhas).
- [x] Webhooks Stripe: tabela de eventos, status, botão "reenviar".

**Próximas ações sugeridas**
- Executar `docs/supabase/phase-3-insights.sql` e validar as novas visões.
- Conectar métricas a dashboards externos se precisar de histórico superior a 60 dias.

## Fase 4 – Configurações Avançadas
- [x] CRUD de planos com atualização dinâmica do `PLANS` (API + UI em `/admin/settings`).
- [x] Monitoramento de variáveis de ambiente críticas (card dedicado em `/admin/settings`).
- [ ] Editor multi-prompt (principal, fallback, onboarding) com versionamento dedicado por tipo.

**Próximas ações sugeridas**
- Rodar `docs/supabase/phase-4-config.sql` no Supabase, conferir seeds e marcar admins.
- Refatorar API `/api/admin/prompt` para aceitar múltiplos tipos de prompt com histórico individual.

## Fase 5 – Segurança & Auditoria
- [ ] Logs de atividade (`admin_logs`).
- [ ] RBAC com campo `role` no perfil + middleware.
- [ ] Página "Status" com saúde dos serviços externos.

## Fase 6 – Automação & Engajamento
- [ ] Segmentações (login recente, assinaturas atrasadas etc.).
- [ ] Ações em massa (e-mails/push via SendGrid/Postmark).
- [ ] Exportação de UTMs e origem de aquisição.

## Anotações Gerais
- Documentar scripts e políticas no repositório (`docs/supabase/` sugerido) para facilitar migrações.
- Validar limites de contexto da IA ao colar prompts extensos; manter histórico reduzido no editor.
- Considerar testes E2E para fluxos críticos do painel conforme as fases avançam.
