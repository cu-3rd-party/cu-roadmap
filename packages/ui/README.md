# @cu/ui

The shared design system for cu-roadmap. Both `frontend/` (public app) and
`admin/` consume it via `workspace:*`, so a change here lands in both.

## What's in here

| Path              | Contents                                                                     |
| ----------------- | ---------------------------------------------------------------------------- |
| `src/styles/`     | Brandbook tokens — the `:root` / `.dark` custom properties and the `@theme` map |
| `src/kit/`        | shadcn-style primitives: `Button`, `Dialog`, `Card`, `Select`, `Sheet`, …     |
| `src/primitives/` | Composed non-domain UI: `Panel`, `HintButton`, `SegmentedProgress`, …         |
| `src/lib/`        | `cn()` and `useMediaQuery()` — the utilities the kit itself depends on        |
| `src/theme/`      | `ThemeProvider` / `useTheme`; owns the `.dark` class the tokens switch on     |

## Entry points

```ts
import { Button, Dialog } from "@cu/ui/kit";
import { Panel } from "@cu/ui/primitives";
import { cn, useMediaQuery } from "@cu/ui/lib";
import { ThemeProvider, useTheme } from "@cu/ui/theme";
import { Button, cn } from "@cu/ui"; // everything
```

```css
@import "@cu/ui/styles.css";
```

## No build step

The package publishes `.tsx` source and each app's Vite compiles it. Both apps
run the same Vite 7 + Tailwind 4 + React 19 toolchain, so there is nothing to
pre-bundle and no `dist/` to keep in sync.

## Tailwind content scanning

`src/styles/index.css` declares `@source ".."` so classes used only inside this
package survive tree-shaking. Consuming apps import that file and add a
`@source` for their own `src/` — see `frontend/src/app/styles/index.css`.

## What does *not* belong here

Anything domain-shaped: entities, features, pages, or components that reference
courses/majors/roadmaps or link to app-specific routes. `GlossaryLink` lives in
`frontend/` for exactly that reason.

## Commands

```bash
pnpm --filter @cu/ui test      # vitest
pnpm --filter @cu/ui lint:ts   # tsc --noEmit
```
