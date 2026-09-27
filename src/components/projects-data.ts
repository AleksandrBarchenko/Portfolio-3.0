/* Shared project data. Kept in a plain (non-"use client") module so it can be
   imported from both the client `Projects` grid and server components like the
   ElioVP case-study page. Importing a plain array across a "use client"
   boundary would hand back a client-reference proxy (no `.filter`), so the data
   must live outside the client module. */

export type Project = {
  image: string;
  /* Small caps line above the title, e.g. "mobile app redesign". */
  label: string;
  /* Year range shown after the accent dot. */
  period: string;
  title: string;
  body: string;
  tags: string[];
  /* Horizontal placement on wide screens — the frames stagger the cards. */
  align: "left" | "right" | "center";
  /* Case-study route. Cards without one keep the placeholder "#" link. */
  href?: string;
};

/* The design still carries placeholder body copy on every card. */
const BODY =
  "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled..";

const TAGS = ["User research", "Visual design", "Analytics"];

export const PROJECTS: Project[] = [
  {
    image: "/projects/vodafone-flows.png",
    label: "mobile app redesign",
    period: "2021–2023",
    title: "Increased basic flows success rate by 17% for Vodafone app",
    body: BODY,
    tags: TAGS,
    align: "left",
    href: "/work/vodafone",
  },
  {
    image: "/projects/vodafone-userbase.png",
    label: "mobile app redesign",
    period: "2023–2024",
    title: "Increased active user base by 12% for Vodafone app",
    body: BODY,
    tags: TAGS,
    align: "right",
    href: "/work/vodafone-userbase",
  },
  {
    image: "/projects/vodafone-webplatform.png",
    label: "web platform redesign",
    period: "2023–2024",
    title: "Divided enterprise system into two targeted solutions",
    body: "Comprehensive work on support and creation of new functionalities for the B2B part and a complete redesign of B2C for Vodafone Ukraine's web platform.",
    tags: TAGS,
    align: "center",
    href: "/work/vodafone-webplatform",
  },
  {
    image: "/projects/vodafone-designsystem.png",
    label: "design system",
    period: "2024",
    title: "Reduced development resources by 30% with Design System rebuild",
    body: BODY,
    tags: TAGS,
    align: "right",
    href: "/work/vodafone-design-system",
  },
  {
    image: "/projects/electric-mobility.png",
    label: "website redesign",
    period: "2024–2025",
    title: "Comprehensive web experience for electric mobility solutions",
    body: BODY,
    tags: TAGS,
    align: "left",
    href: "/work/eliovp",
  },
  {
    image: "/projects/construction-saas.png",
    label: "mobile app redesign",
    period: "2018–2020",
    title: "End-to-end redesign for construction SaaS",
    body: BODY,
    tags: TAGS,
    align: "center",
    href: "/work/zimaone",
  },
  {
    image: "/projects/under-armour.png",
    label: "mobile app & web design",
    period: "2020–2021",
    title: "Cognitive training app & website for Under Armour partnership",
    body: BODY,
    tags: TAGS,
    align: "left",
    href: "/work/reflexion",
  },
];
