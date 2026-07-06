import { CircleQuestionMark } from "lucide-react";
import { Fragment, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { cn, useMediaQuery } from "@/shared/lib";
import { Chip, CollapsiblePanel, Panel } from "@/shared/ui";

import { GLOSSARY_ENTRIES } from "./model/glossary-data";

// Renders a single line, turning `**bold**` spans into <strong>.
const renderInline = (line: string) =>
  line.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <strong key={i} className="font-semibold text-fg-primary">
        {part.slice(2, -2)}
      </strong>
    ) : (
      <Fragment key={i}>{part}</Fragment>
    ),
  );

// Lightweight markdown: **bold**, `\n`-separated lines, `- ` bullet lists.
const RichText = ({ text }: { text: string }) => {
  const lines = text.split("\n").filter((line) => line.trim() !== "");
  const blocks: ReactNode[] = [];
  let bullets: string[] = [];

  const flushBullets = (key: string) => {
    if (bullets.length === 0) return;
    const items = bullets;
    bullets = [];
    blocks.push(
      <ul key={key} className="flex list-disc flex-col gap-1 pl-5">
        {items.map((item, i) => (
          <li key={i}>{renderInline(item)}</li>
        ))}
      </ul>,
    );
  };

  lines.forEach((line, i) => {
    const trimmed = line.trimStart();
    if (trimmed.startsWith("- ")) {
      bullets.push(trimmed.slice(2));
    } else {
      flushBullets(`ul-${i}`);
      blocks.push(<p key={i}>{renderInline(line)}</p>);
    }
  });
  flushBullets("ul-end");

  return <div className="flex flex-col gap-1.5">{blocks}</div>;
};

const GlossaryPage = () => {
  const isMobile = useMediaQuery("md");
  const location = useLocation();
  const navigate = useNavigate();

  const activeId = location.hash.replace("#", "") || null;
  const hasActive = activeId !== null;

  const setActive = (id: string, open: boolean) =>
    navigate(open ? `/glossary#${id}` : "/glossary", { replace: true });

  return (
    <div className="mx-auto flex w-full max-w-screen-2xl flex-col gap-2">
      <Panel className="flex flex-col gap-4 px-2 sm:px-4 lg:px-6">
        <div className="mb-4 flex flex-col gap-3 px-1">
          <div className="flex w-full gap-4 h-10 items-center">
            <Chip variant="blue" size={isMobile ? "xs" : "sm"}>
              <CircleQuestionMark />
            </Chip>
            <h1 className="text-2xl font-bold text-fg-primary">Глоссарий</h1>
          </div>

          <div className="text-sm text-fg-secondary">
            <p>
              В Центральном Университете используются различные термины по
              образовательной части, которые могут быть тебе незнакомы: держи
              список основных из них.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          {GLOSSARY_ENTRIES.map((entry) => (
            <CollapsiblePanel
              key={entry.id}
              title={entry.term}
              rowClickable
              open={activeId === entry.id}
              onOpenChange={(next) => setActive(entry.id, next)}
              extraPadded={false}
              className={cn(
                "transition-opacity duration-300",
                hasActive && activeId !== entry.id && "opacity-40",
              )}
            >
              <div className="rounded-xl bg-background px-5 py-3 text-sm text-fg-primary">
                <RichText text={entry.description} />
              </div>
            </CollapsiblePanel>
          ))}
        </div>
      </Panel>
    </div>
  );
};

export default GlossaryPage;
