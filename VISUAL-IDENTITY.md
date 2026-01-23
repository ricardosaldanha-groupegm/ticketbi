## Guia de Estilos – TicketBI

Este documento descreve a identidade visual completa do TicketBI para que outros projetos possam replicar fielmente o mesmo look & feel.

---

### 1. Identidade geral

- **Tema**: Interface escura, moderna, com base em cinzas/azuis (`slate`) e acentos em **âmbar/amarelo**.
- **Tom geral**: Profissional, sóbrio e técnico, sem elementos “divertidos” ou infantis.
- **Tipografia**: Fonte sem serifa (ex: **Inter**), com forte hierarquia visual entre títulos, subtítulos e corpo de texto.

---

### 2. Paleta de cores

#### 2.1. Design tokens (CSS / shadcn)

Definidos em `app/globals.css` e usados via Tailwind (`bg-background`, `text-foreground`, `bg-primary`, etc.).

**Modo claro (`:root`) – pouco usado em produção, mas suportado:**

- `--background`: `0 0% 100%`
- `--foreground`: `20 14.3% 4.1%`
- `--card`: `0 0% 100%`
- `--card-foreground`: `20 14.3% 4.1%`
- `--popover`: `0 0% 100%`
- `--popover-foreground`: `20 14.3% 4.1%`
- `--primary`: `47.9 95.8% 53.1%` – âmbar.
- `--primary-foreground`: `26 83.3% 14.1%`
- `--secondary`: `60 4.8% 95.9%`
- `--secondary-foreground`: `24 9.8% 10%`
- `--muted`: `60 4.8% 95.9%`
- `--muted-foreground`: `25 5.3% 44.7%`
- `--accent`: `60 4.8% 95.9%`
- `--accent-foreground`: `24 9.8% 10%`
- `--destructive`: `0 84.2% 60.2%`
- `--destructive-foreground`: `60 9.1% 97.8%`
- `--border`: `20 5.9% 90%`
- `--input`: `20 5.9% 90%`
- `--ring`: `20 14.3% 4.1%`
- `--radius`: `0.65rem`

**Modo escuro (`.dark`) – configuração usada em produção:**

- `--background`: `20 14.3% 4.1%` – fundo praticamente preto.
- `--foreground`: `60 9.1% 97.8%` – texto quase branco.
- `--card`: `20 14.3% 4.1%` – cartões escuros.
- `--card-foreground`: `60 9.1% 97.8%`
- `--popover`: `20 14.3% 4.1%`
- `--popover-foreground`: `60 9.1% 97.8%`
- `--primary`: `47.9 95.8% 53.1%` – âmbar principal (botões, links importantes).
- `--primary-foreground`: `26 83.3% 14.1%`
- `--secondary`: `12 6.5% 15.1%` – cinza escuro.
- `--secondary-foreground`: `60 9.1% 97.8%`
- `--muted`: `12 6.5% 15.1%`
- `--muted-foreground`: `24 5.4% 63.9%`
- `--accent`: `12 6.5% 15.1%`
- `--accent-foreground`: `60 9.1% 97.8%`
- `--destructive`: `0 62.8% 30.6%` – vermelho escuro.
- `--destructive-foreground`: `60 9.1% 97.8%`
- `--border`: `12 6.5% 15.1%`
- `--input`: `12 6.5% 15.1%`
- `--ring`: `35.5 91.7% 32.9%` – anel de focus âmbar.

#### 2.2. Tradução prática em Tailwind

- **Fundo global autenticado**: `bg-slate-900`.
- **Cartões/caixas**: `bg-slate-800 border border-slate-700 rounded-lg`.
- **Texto**:
  - Principal: `text-foreground` ou `text-slate-100`.
  - Secundário: `text-slate-300`.
  - Descritivo/ajuda: `text-slate-400` ou `text-muted-foreground`.
- **Ação principal**:
  - `bg-primary` ou diretamente `bg-amber-600 text-white hover:bg-amber-700`.
- **Links importantes**:
  - `text-amber-400 hover:text-amber-300 underline`.

---

### 3. Tipografia e hierarquia

- **Fonte principal**: `Inter` (ou fonte sem serifa equivalente), aplicada globalmente.
- **Tamanhos e pesos típicos**:
  - Título de página (H1): `text-2xl md:text-3xl font-bold text-slate-100`.
  - Título de secção (H2): `text-xl font-semibold text-slate-100 mb-4 border-b border-slate-700 pb-2`.
  - Subsecções (H3): `text-lg font-medium text-slate-100 mb-3 mt-6`.
  - Texto corpo: `text-slate-300 text-sm` ou `text-slate-300 leading-relaxed`.
  - Ajuda/descrições: `text-slate-400 text-sm`.

**Ênfase e código inline (markdown):**

- Negrito: `<strong class="font-semibold text-slate-100">`.
- Itálico: `<em class="italic">`.
- Links: `<a class="text-amber-400 hover:text-amber-300 underline">`.
- Código inline: `<code class="bg-slate-800 px-1.5 py-0.5 rounded text-amber-300 font-mono text-sm">`.

---

### 4. Layout e espaçamento

#### 4.1. Estrutura global

- Layout autenticado:
  - `min-h-screen bg-slate-900`.
  - `main` com `container mx-auto px-4 py-6`.
  - Header fixo com fundo `bg-slate-900 border-b border-slate-700`.

- Cartões/caixas:
  - `bg-slate-800 border border-slate-700 rounded-lg p-6` ou `p-8`.

#### 4.2. Exemplos de páginas

- `/tickets`:
  - H1 + subtítulo em `text-slate-400`.
  - Botão “Novo Ticket”: `bg-amber-600 text-white hover:bg-amber-700 px-4 py-2 rounded-md`.
  - Lista de tickets dentro de card: `bg-slate-800 border border-slate-700 rounded-lg p-6`.

- `/ajuda`:
  - Wrapper: `min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4`.
  - Cartão central: `w-full max-w-4xl bg-slate-900 border border-slate-700 rounded-lg p-6 md:p-8`.
  - Conteúdo textual (Introdução + Acesso ao Sistema) com renderização markdown.
  - Toggle de idioma PT/ES com bandeiras (ver secção 6).

---

### 5. Botões

Baseados nos componentes `Button` do shadcn/ui (`components/ui/button.tsx`):

- Primário: `bg-primary text-primary-foreground hover:bg-primary/90`.
- Destrutivo: `bg-destructive text-destructive-foreground hover:bg-destructive/90`.
- Outline: `border border-input bg-background hover:bg-accent hover:text-accent-foreground`.
- Secondary: `bg-secondary text-secondary-foreground hover:bg-secondary/80`.
- Ghost: `hover:bg-accent hover:text-accent-foreground`.
- Link: `text-primary underline-offset-4 hover:underline`.

Extras em âmbar direto:

- `bg-amber-600 text-white hover:bg-amber-700 px-4 py-2 rounded-md` para ações principais (ex: “Novo Ticket”).

---

### 6. Toggle de idioma (PT/ES)

Usado em `/tutorial` e `/ajuda`.

- Container: `flex items-center gap-1 bg-slate-800 border border-slate-700 rounded-lg p-1`.
- Botão (bandeira PT/ES):
  - Base: `p-2 rounded-md transition-all flex items-center justify-center`.
  - Ativo: `bg-amber-600 shadow-md scale-110`.
  - Inativo: `hover:bg-slate-700 opacity-70 hover:opacity-100`.
  - Ícone: bandeira (emoji) com `text-2xl`.

Os termos da interface (rótulos de botões, nomes de campos) **mantêm-se em português**; o idioma apenas altera o conteúdo explicativo.

---

### 7. Badges de estado (tickets)

Paleta fixa para estados de ticket:

- `novo`: `bg-sky-600 text-white`.
- `em_analise`: `bg-amber-500 text-white`.
- `em_curso`: `bg-orange-600 text-white`.
- `em_validacao`: `bg-violet-600 text-white`.
- `concluido`: `bg-emerald-600 text-white`.
- `rejeitado`: `bg-rose-600 text-white`.
- `bloqueado`: `bg-slate-700 text-white`.
- `Aguardando 3ºs`: `bg-amber-500 text-white`.
- `Standby`: `bg-violet-600 text-white`.

Sempre em forma de `Badge` pequeno, com cantos arredondados.

---

### 8. Cores de prioridade

A prioridade (urgência × importância, 1 a 9) usa um gradiente de verde → amarelo/laranja → vermelho:

- `1`: `bg-emerald-600 text-white`.
- `2`: `bg-green-200 text-green-900`.
- `3`: `bg-lime-200 text-lime-900`.
- `4`: `bg-amber-500 text-white`.
- `5`: `bg-yellow-200 text-yellow-900`.
- `6`: `bg-orange-200 text-orange-900`.
- `7`: `bg-orange-300 text-orange-900`.
- `8`: `bg-rose-600 text-white`.
- `9`: `bg-red-200 text-red-900`.

---

### 9. Indicadores visuais de prazo

Associados ao campo “Dias p/ fim”:

- Bolinhas antes do assunto:
  - Atrasado (`dias < 0`): `h-2.5 w-2.5 rounded-full bg-red-400/80`.
  - Prazo a terminar (`0 ≤ dias < 5`): `h-2.5 w-2.5 rounded-full bg-amber-400/80`.

- Texto na coluna “Dias p/ fim”:
  - Sem data: `text-slate-400 text-xs` – “sem data”.
  - Atrasado: `text-red-300 text-xs` – `X dias em atraso`.
  - Termina hoje: `text-amber-300 text-xs` – “termina hoje”.
  - Dentro do prazo: `text-emerald-300 text-xs` – `faltam X dias`.

---

### 10. Resumo para reutilização noutros projetos

Para replicar a identidade visual do TicketBI:

- Use **tema escuro** com fundo quase preto (`bg-slate-900`) e cartões `bg-slate-800` com borda `border-slate-700`.
- Use âmbar (`primary`) para ações principais, com botões cheios e links destacados.
- Tipografia sem serifa (Inter), com H1 forte, H2 com linha inferior, corpo em `text-sm`/`text-base`.
- Reaproveite os mesmos padrões de badges de estado, cores de prioridade e indicadores de prazo.
- Use o mesmo padrão de toggle de idioma com bandeiras, quando necessário.

Este ficheiro deve ser a referência principal para qualquer equipa que queira alinhar visualmente outro projeto ao TicketBI.
