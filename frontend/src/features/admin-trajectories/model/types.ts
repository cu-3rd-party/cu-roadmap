// Admin-side view of a specialization. Deliberately narrower than
// `entities/specialization`'s `Specialization` — the editor only needs what the
// list row renders until the admin endpoints are wired up.
export interface AdminSpecialization {
  id: string;
  majorId: string;
  title: string;
}

// One pill in the "направление" row. Becomes `Major` once the majors query
// backs this screen.
export interface MajorTab {
  id: string;
  label: string;
}
