import { Bookmark, Plus, Search } from "lucide-react";

import { Badge } from "@/shared/ui/kit/badge";
import { Button } from "@/shared/ui/kit/button";
import { Chip } from "@/shared/ui/kit/chip";
import { Counter } from "@/shared/ui/kit/counter";
import { Input } from "@/shared/ui/kit/input";

const SIZES = ["xxs", "xs", "sm", "md", "lg"] as const;

const SIZE_LABELS: Record<(typeof SIZES)[number], string> = {
  xxs: "xxs · 24px",
  xs: "xs · 32px",
  sm: "sm · 40px",
  md: "md · 48px",
  lg: "lg · 56px",
};

const STATES = ["normal", "hover", "focus", "pressed", "disabled"] as const;

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4">
      <h2
        className="text-xs font-semibold uppercase tracking-widest"
        style={{ color: "var(--text-tertiary)" }}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap items-center gap-6">{children}</div>;
}

function LabeledItem({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      {children}
      <span
        className="text-[10px] font-mono"
        style={{ color: "var(--text-tertiary)" }}
      >
        {label}
      </span>
    </div>
  );
}

function Divider() {
  return <div className="border-t" style={{ borderColor: "var(--border)" }} />;
}

function VariantSizes({ variant }: { variant: "outline" | "tertiary" }) {
  return (
    <>
      <Section title={`${variant} · size · text`}>
        <Row>
          {SIZES.map((size) => (
            <LabeledItem key={size} label={SIZE_LABELS[size]}>
              <Button variant={variant} size={size}>
                Выбрать
              </Button>
            </LabeledItem>
          ))}
        </Row>
      </Section>

      <Section title={`${variant} · size · icon`}>
        <Row>
          {SIZES.map((size) => (
            <LabeledItem key={size} label={SIZE_LABELS[size]}>
              <Button variant={variant} size={size} icon={<Plus />} />
            </LabeledItem>
          ))}
        </Row>
      </Section>

      <Section title={`${variant} · states · text · xxs`}>
        <Row>
          {STATES.map((state) => (
            <LabeledItem key={state} label={state}>
              <Button
                variant={variant}
                size="xxs"
                disabled={state === "disabled"}
              >
                Выбрать
              </Button>
            </LabeledItem>
          ))}
        </Row>
      </Section>

      <Section title={`${variant} · states · icon · xxs`}>
        <Row>
          {STATES.map((state) => (
            <LabeledItem key={state} label={state}>
              <Button
                variant={variant}
                size="xxs"
                icon={<Plus />}
                disabled={state === "disabled"}
              />
            </LabeledItem>
          ))}
        </Row>
      </Section>
    </>
  );
}

export default function ButtonDemoPage() {
  return (
    <div
      className="min-h-screen p-10 flex flex-col gap-12"
      style={{ background: "var(--background)", color: "var(--text-primary)" }}
    >
      <header className="flex flex-col gap-1">
        <h1
          className="text-2xl font-semibold tracking-tight"
          style={{ color: "var(--text-primary)" }}
        >
          Button
        </h1>
      </header>

      <VariantSizes variant="outline" />
      <Divider />
      <VariantSizes variant="tertiary" />
      <Divider />

      {/* ── Input ── */}
      <Section title="Input · sizes">
        <div className="flex flex-col gap-3">
          {(["sm", "md", "lg"] as const).map((size) => (
            <LabeledItem
              key={size}
              label={`${size} · ${size === "sm" ? "40" : size === "md" ? "48" : "56"}px`}
            >
              <Input
                size={size}
                placeholder="Placeholder..."
                wrapperClassName="w-80"
              />
            </LabeledItem>
          ))}
        </div>
      </Section>

      <Section title="Input · icon">
        <div className="flex flex-col gap-3">
          {(["sm", "md", "lg"] as const).map((size) => (
            <LabeledItem key={size} label={`${size} · icon`}>
              <Input
                size={size}
                icon={<Search />}
                placeholder="Поиск..."
                wrapperClassName="w-80"
              />
            </LabeledItem>
          ))}
        </div>
      </Section>

      <Section title="Input · states">
        <div className="flex flex-col gap-3">
          <LabeledItem label="normal">
            <Input
              size="md"
              placeholder="Placeholder..."
              wrapperClassName="w-80"
            />
          </LabeledItem>
          <LabeledItem label="disabled">
            <Input
              size="md"
              placeholder="Placeholder..."
              wrapperClassName="w-80"
              disabled
            />
          </LabeledItem>
          <LabeledItem label="with value">
            <Input
              size="md"
              defaultValue="Введённый текст"
              wrapperClassName="w-80"
            />
          </LabeledItem>
        </div>
      </Section>

      <Divider />

      {/* ── Badge ── */}
      <Section title="Badge · outline · no icon">
        <Row>
          {(["3xs", "xxs", "xs"] as const).map((size) => (
            <LabeledItem
              key={size}
              label={`${size} · ${size === "3xs" ? "20" : size === "xxs" ? "24" : "32"}px`}
            >
              <Badge variant="outline" size={size}>
                Prerekvizit
              </Badge>
            </LabeledItem>
          ))}
        </Row>
      </Section>

      <Section title="Badge · outline · icon">
        <Row>
          {(["3xs", "xxs", "xs"] as const).map((size) => (
            <LabeledItem
              key={size}
              label={`${size} · ${size === "3xs" ? "20" : size === "xxs" ? "24" : "32"}px`}
            >
              <Badge variant="outline" size={size}>
                <Bookmark data-icon="inline-start" />
                Prerekvizit
              </Badge>
            </LabeledItem>
          ))}
        </Row>
      </Section>

      <Section title="Badge · color variants">
        <Row>
          {(["blue", "yellow", "red", "green", "orange"] as const).map(
            (variant) => (
              <LabeledItem key={variant} label={variant}>
                <div className="flex flex-col items-center gap-2">
                  {(["3xs", "xxs", "xs"] as const).map((size) => (
                    <Badge key={size} variant={variant} size={size}>
                      Major core
                    </Badge>
                  ))}
                </div>
              </LabeledItem>
            ),
          )}
        </Row>
      </Section>

      <Divider />

      {/* ── Counter ── */}
      <Section title="Counter · variants">
        <Row>
          {(["primary", "secondary", "contrast"] as const).map((variant) => (
            <LabeledItem key={variant} label={variant}>
              <div className="flex items-end gap-3">
                {(["4xs", "3xs", "xxs"] as const).map((size) => (
                  <LabeledItem key={size} label={size}>
                    <Counter variant={variant} size={size}>
                      {size === "4xs" ? null : 4}
                    </Counter>
                  </LabeledItem>
                ))}
              </div>
            </LabeledItem>
          ))}
        </Row>
      </Section>

      <Divider />

      {/* ── Chip ── */}
      <Section title="Chip · default">
        <Row>
          {(["3xs", "xxs", "xs"] as const).map((size) => (
            <LabeledItem key={size} label={size}>
              <Chip size={size}>Категория</Chip>
            </LabeledItem>
          ))}
        </Row>
      </Section>

      <Section title="Chip · counter">
        <Row>
          {(["3xs", "xxs", "xs"] as const).map((size) => (
            <LabeledItem key={size} label={size}>
              <Chip variant="counter" size={size}>
                Категория
                <Counter variant="primary" size="xxs">
                  {" "}
                  4{" "}
                </Counter>
              </Chip>
            </LabeledItem>
          ))}
        </Row>
      </Section>
    </div>
  );
}
