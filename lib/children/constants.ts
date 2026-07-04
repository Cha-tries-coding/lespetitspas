export const CHILD_SECTIONS = ["Bébés", "Moyens", "Grands"] as const;

export type ChildSection = (typeof CHILD_SECTIONS)[number];

export const ALL_SECTIONS_FILTER = "Toutes" as const;

export type SectionFilter = ChildSection | typeof ALL_SECTIONS_FILTER;

export const SECTION_FILTERS: SectionFilter[] = [
  ALL_SECTIONS_FILTER,
  ...CHILD_SECTIONS,
];
