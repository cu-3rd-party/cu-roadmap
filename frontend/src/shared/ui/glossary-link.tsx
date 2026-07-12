import type { ReactNode } from "react";
import { Link } from "react-router-dom";

import type { GlossaryId } from "@/shared/model";

// Links a course-type mention to its glossary entry; the glossary page opens
// the matching panel from the URL hash (e.g. /glossary#core).
export const GlossaryLink = ({
  id,
  children,
}: {
  id: GlossaryId;
  children: ReactNode;
}) => (
  <Link
    to={`/glossary#${id}`}
    className="underline underline-offset-2 hover:opacity-80"
  >
    {children}
  </Link>
);
