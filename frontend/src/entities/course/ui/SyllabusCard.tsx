import { RevealImage } from "@/shared/ui";

interface SyllabusCardProps {
  link: string;
}

export const SyllabusCard = ({ link }: SyllabusCardProps) => (
  <a
    href={link}
    target="_blank"
    rel="noreferrer"
    className="relative block overflow-hidden rounded-xl bg-sure-blue-transparent p-4 transition duration-(--std-duration) hover:bg-sure-blue-pale focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
  >
    <div className="text-sm text-fg-sure-blue">Подробнее о курсе</div>
    <div className="text-lg font-medium text-fg-primary">Силлабус</div>
    <RevealImage
      src="/confederate.png"
      alt=""
      aria-hidden
      className="pointer-events-none absolute right-6 top-1 w-28 h-20 select-none"
    />
  </a>
);
