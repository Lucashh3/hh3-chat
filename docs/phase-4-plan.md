# Fase 4 – Configurações Avançadas (Plano de Execução)

## Objetivos
1. **CRUD de Plans dinâmico** – migração do array `PLANS` para persistência em banco, com API de gerenciamento e UI no painel.
2. **Monitoramento de variáveis críticas** – checar chaves como `DEEPSEEK_API_KEY`, `ADMIN_EMAILS` etc., e sinalizar no painel quando ausentes.
3. **Editor multi-prompt com versionamento** – separar prompt principal, fallback e onboarding, permitindo histórico por tipo e restauração rápida.

## Passo a Passo Proposto
### 1. Planos dinâmicos
- Criar tabela `plans` no Supabase com colunas `id`, `name`, `description`, `price_monthly`, `price_yearly`, `features` (text[]), `is_active`.
- Popular tabela com dados atuais do `lib/plans.ts` via script de migração (`docs/supabase/phase-4-config.sql`) e expor view somente de planos ativos.
- Atualizar backend e rotas para ler planos do banco; manter fallback em `lib/plans` até finalizar migração.
- Implementar `/api/admin/plans` (GET/POST/PATCH/DELETE soft) com políticas RLS restritas a admins.
- Criar seção “Planos” no painel (Fase 4) com listagem, formulário e validações básicas.

### 2. Monitor de variáveis de ambiente
- Definir lista de envs obrigatórios/opcionais com descrições.
- Implementar helper em `lib/env/health.ts` que verifica presença/formatos e retorna severidade (ok/alerta/crítico).
- Expor rota `/api/admin/env` para admins consumirem diagnóstico.
- Adicionar card de alertas no painel com status e instruções de correção.

### 3. Editor multi-prompt
- Tabela `admin_prompts` com colunas `type` (`system`, `fallback`, `onboarding`), `value`, `updated_at`, `history` (JSONB) semelhante ao fluxo atual.
- Atualizar API `/api/admin/prompt` para aceitar `type` e agrupar histórico por prompt.
- UI: tabs ou select para navegar entre tipos, exibir histórico individual e botão de restaurar padrão de cada um.
- Definir prompt padrão por tipo em arquivo `Prompt.txt` segmentado ou múltiplos arquivos (ex.: `prompts/system.txt`, `prompts/fallback.txt`).

## Dependências e Considerações
- Executar novo script SQL (criação de `plans`, `admin_prompts`) antes de liberar UI.
- Garantir migração suave: enquanto o CRUD não estiver ativo, manter leitura fallback do array estático.
- Validar impacto nas rotas públicas `/api/plans` (se existir) e em qualquer interface que consuma os dados dos planos.
- Adicionar testes manuais para edição simultânea de prompts e fallback em caso de chave ausente.

## Próximas Entregas sugeridas
1. Implementar camada de dados (tabelas + scripts) com atualização mínima do backend para ler planos dinâmicos.
2. Criar interface administrativa para planos.
3. Adicionar monitoramento de envs com card de alertas.
4. Estender editor de prompts para múltiplos perfis.
