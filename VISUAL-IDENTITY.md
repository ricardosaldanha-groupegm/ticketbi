## Guia de Estilos – TicketBI

### Identidade geral

- **Tema**: Interface escura com base em cinzas/azuis (`slate`) e acentos em **âmbar/amarelo**.
- **Tipografia**: Fonte **Inter** (Google Fonts), aplicada globalmente ao `body`.

### Tipografia

- **Fonte principal**: `Inter` (Google Font), aplicada no layout raiz.
- Utilização típica: `text-sm`–`text-3xl`, com `font-medium` e `font-bold` para títulos e labels importantes.

### Paleta base (tokens CSS / shadcn)

Definida em `app/globals.css`.

**Modo claro (`:root`):**

- `--background`: `0 0% 100%` – fundo branco.
- `--foreground`: `20 14.3% 4.1%` – texto principal escuro.
- `--card`: `0 0% 100%` – fundo de cartões claro.
- `--card-foreground`: `20 14.3% 4.1%` – texto em cartões.
- `--popover`: `0 0% 100%` – fundo de popovers.
- `--popover-foreground`: `20 14.3% 4.1%` – texto em popovers.
- `--primary`: `47.9 95.8% 53.1%` – **âmbar/amarelo** principal.
- `--primary-foreground`: `26 83.3% 14.1%` – texto sobre o primário.
- `--secondary`: `60 4.8% 95.9%` – cinza muito claro.
- `--secondary-foreground`: `24 9.8% 10%` – texto em secondary.
- `--muted`: `60 4.8% 95.9%` – fundos suaves.
- `--muted-foreground`: `25 5.3% 44.7%` – texto menos importante.
- `--accent`: `60 4.8% 95.9%` – acentos leves.
- `--accent-foreground`: `24 9.8% 10%` – texto em accent.
- `--destructive`: `0 84.2% 60.2%` – vermelho para ações destrutivas.
- `--destructive-foreground`: `60 9.1% 97.8%` – texto sobre destructive.
- `--border`: `20 5.9% 90%` – cor de borda.
- `--input`: `20 5.9% 90%` – fundos de inputs.
- `--ring`: `20 14.3% 4.1%` – cor de focus.
- `--radius`: `0.65rem` – raio base de bordas.

**Modo escuro (`.dark`) – usado em produção:**

- `--background`: `20 14.3% 4.1%` – fundo quase preto quente.
- `--foreground`: `60 9.1% 97.8%` – texto quase branco.
- `--card`: `20 14.3% 4.1%` – fundo de cartões escuro.
- `--card-foreground`: `60 9.1% 97.8%` – texto em cartões.
- `--popover`: `20 14.3% 4.1%` – fundo de popovers.
- `--popover-foreground`: `60 9.1% 97.8%` – texto em popovers.
- `--primary`: `47.9 95.8% 53.1%` – **âmbar** principal.
- `--primary-foreground`: `26 83.3% 14.1%`.
- `--secondary`: `12 6.5% 15.1%` – cinza escuro.
- `--secondary-foreground`: `60 9.1% 97.8%`.
- `--muted`: `12 6.5% 15.1%`.
- `--muted-foreground`: `24 5.4% 63.9%`.
- `--accent`: `12 6.5% 15.1%`.
- `--accent-foreground`: `60 9.1% 97.8%`.
- `--destructive`: `0 62.8% 30.6%` – vermelho escuro.
- `--destructive-foreground`: `60 9.1% 97.8%`.
- `--border`: `12 6.5% 15.1%`.
- `--input`: `12 6.5% 15.1%`.
- `--ring`: `35.5 91.7% 32.9%` – anel de focus em tom âmbar.

O Tailwind mapeia estes tokens para utilitários como `bg-background`, `text-foreground`, `bg-primary`, etc., em `tailwind.config.js`.

### Layout e fundos

- **Fundo global** (páginas autenticadas): `bg-slate-900`.
- **Cartões/caixas de conteúdo**: `bg-slate-800` com `border-slate-700` e `rounded-lg`.
- **Texto**:
  - Principal: `text-foreground` (quase branco) ou `text-slate-100`.
  - Secundário: `text-slate-300`.
  - Ajuda/descrições: `text-slate-400` / `text-muted-foreground`.

Exemplos típicos de layout:

- Container principal:
  - `min-h-screen bg-slate-900`.
  - Conteúdo dentro de `main` com `container mx-auto px-4 py-6`.
- Blocos de conteúdo (cards): `bg-slate-800 border border-slate-700 rounded-lg p-6`.

### Botões

Baseados nos componentes `Button` do shadcn/ui (`components/ui/button.tsx`), que usam os tokens de cor semânticos:

- **Primário (default)**:
  - `bg-primary text-primary-foreground hover:bg-primary/90`.
- **Destrutivo**:
  - `bg-destructive text-destructive-foreground hover:bg-destructive/90`.
- **Outline**:
  - `border border-input bg-background hover:bg-accent hover:text-accent-foreground`.
- **Secondary**:
  - `bg-secondary text-secondary-foreground hover:bg-secondary/80`.
- **Ghost**:
  - `hover:bg-accent hover:text-accent-foreground`.
- **Link**:
  - `text-primary underline-offset-4 hover:underline`.

Além disso, alguns botões de ação importantes utilizam diretamente classes Tailwind em tons de âmbar, por exemplo:

- `bg-amber-600 text-white hover:bg-amber-700 px-4 py-2 rounded-md` para o botão "Novo Ticket".

### Badges de estado (tickets)

Os estados dos tickets utilizam uma paleta forte e bem diferenciada:

- `novo`: `bg-sky-600 text-white` (azul).
- `em_analise`: `bg-amber-500 text-white` (amarelo).
- `em_curso`: `bg-orange-600 text-white` (laranja forte).
- `em_validacao`: `bg-violet-600 text-white` (violeta).
- `concluido`: `bg-emerald-600 text-white` (verde).
- `rejeitado`: `bg-rose-600 text-white` (rosa/vermelho).
- `bloqueado`: `bg-slate-700 text-white` (cinza escuro).
- `Aguardando 3ºs`: `bg-amber-500 text-white`.
- `Standby`: `bg-violet-600 text-white`.

Estas cores são usadas em `Badge` para destacar claramente o estado de cada ticket.

### Cores de prioridade

A prioridade (resultado de urgência × importância) é representada com um gradiente de verde → amarelo/laranja → vermelho:

- `1`: `bg-emerald-600 text-white` – mais baixo, verde forte.
- `2`: `bg-green-200 text-green-900`.
- `3`: `bg-lime-200 text-lime-900`.
- `4`: `bg-amber-500 text-white`.
- `5`: `bg-yellow-200 text-yellow-900`.
- `6`: `bg-orange-200 text-orange-900`.
- `7`: `bg-orange-300 text-orange-900`.
- `8`: `bg-rose-600 text-white`.
- `9`: `bg-red-200 text-red-900` – mais alto, vermelho claro.

### Indicadores visuais de prazo (tickets)

Nos tickets, há indicadores visuais adicionais associados ao prazo (`Dias p/ fim`):

- **Bolinhas antes do assunto**:
  - Se `dias < 0` (atrasado):
    - Pequena bolinha **vermelha suave**: `h-2.5 w-2.5 rounded-full bg-red-400/80`.
  - Se `0 ≤ dias < 5` (prazo a terminar):
    - Pequena bolinha **amarela**: `h-2.5 w-2.5 rounded-full bg-amber-400/80`.

- **Texto na coluna "Dias p/ fim"**:
  - Sem data definida: `text-slate-400 text-xs` – "sem data".
  - Atrasado (`dias < 0`): `text-red-300 text-xs` – `X dias em atraso`.
  - Termina hoje (`dias === 0`): `text-amber-300 text-xs` – "termina hoje".
  - Dentro do prazo (`dias > 0`): `text-emerald-300 text-xs` – `faltam X dias`.

### Resumo da identidade visual

- **Fundo**:
  - Global: `bg-slate-900`.
  - Cartões: `bg-slate-800` + `border-slate-700`.
- **Texto**:
  - Principal: `text-foreground` (`≈` branco) / `text-slate-100`.
  - Secundário: `text-slate-300`.
  - Ajuda/descrições: `text-slate-400` ou `text-muted-foreground`.
- **Cor de ação principal**:
  - Tokens `primary` (âmbar) e classes `bg-amber-500/600/700`.
- **Estados e feedback**:
  - Azul para "Novo"; amarelo/laranja para análise/curso; violeta para validação/standby; verde para concluído; vermelho/rosa para erros/rejeitado; cinzas para bloqueado/neutral.
- **Tipografia**:
  - `Inter`, com ênfase em `font-medium` e `font-bold` para elementos importantes.

Este documento deve ser usado como referência rápida para manter consistência visual em novas páginas, componentes e funcionalidades da aplicação TicketBI.
