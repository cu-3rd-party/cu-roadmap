import { Panel } from "@cu/ui/primitives";

interface PagePlaceholderProps {
  title: string;
  description: string;
}

/* Stand-in for sections whose features aren't built yet. Keeps the shell
   navigable and renders through the shared design system so the eventual
   real page starts from the right surface. */
export function PagePlaceholder({ title, description }: PagePlaceholderProps) {
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold text-fg-primary">{title}</h1>
        <p className="text-sm text-fg-secondary">{description}</p>
      </header>

      <Panel>
        <p className="p-6 text-sm text-fg-muted">Раздел в разработке.</p>
      </Panel>
    </div>
  );
}
