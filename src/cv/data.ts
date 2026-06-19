import { siteConfig } from "../config";

/**
 * CV content — English only, standalone from the i18n dictionary.
 *
 * This module is the source of truth for both the `/cv` web page and the
 * generated `public/cv.pdf` (see `scripts/build-cv.mjs`).
 */

export interface CvSkillGroup {
  label: string;
  items: string[];
}

export interface CvExperienceEntry {
  company: string;
  companyUrl?: string;
  role: string;
  location: string;
  period: string;
  /** Short framing line shown above the bullet list. */
  lead: string;
  bullets: string[];
  stack: string[];
}

export interface CvLanguageEntry {
  name: string;
  level: string;
}

export interface CvEducationEntry {
  degree: string;
  school: string;
  schoolUrl?: string;
  location: string;
  period: string;
}

export const cv = {
  name: siteConfig.person.name,
  roleGeneral: "Software Engineer",
  roleDomain: "Applied AI",
  location: "Sofia, Bulgaria",
  availability: "Open to freelance & full-time — remote (all timezones) or on-site in Sofia",

  contacts: [
    { label: "Email", value: siteConfig.contactEmail, href: `mailto:${siteConfig.contactEmail}` },
    { label: "Site", value: "bohdanmoroz.com", href: "https://bohdanmoroz.com" },
    { label: "GitHub", value: "bohdanmoroz11", href: siteConfig.githubUrl },
    {
      label: "LinkedIn",
      value: "bohdan-moroz-dev",
      href: siteConfig.linkedinUrl,
    },
  ],

  summary:
    "Full-stack TypeScript engineer with four years shipping production web & mobile systems for US logistics, HR and fintech operators. Comfortable owning a feature end-to-end — frontend, backend, infrastructure and deploy — with agentic AI woven into the day-to-day: I build the tooling, run self-hosted inference, and agents handle the typing while I drive architecture, review and integration.",

  skills: [
    {
      label: "Languages",
      items: ["TypeScript", "JavaScript", "SQL", "HTML / CSS"],
    },
    {
      label: "Frontend",
      items: [
        "React",
        "Next.js",
        "Vue / Nuxt",
        "React Native (Expo)",
        "Tailwind",
        "MUI · Ant Design · Radix",
        "TanStack Query / Router",
        "Zustand · Redux Toolkit",
      ],
    },
    {
      label: "Backend",
      items: [
        "Node.js",
        "NestJS · Fastify · Express",
        "PostgreSQL",
        "Prisma · Sequelize",
        "Redis · BullMQ",
        "Socket.IO · WebSockets",
      ],
    },
    {
      label: "Applied AI",
      items: [
        "Agentic LLM workflows",
        "Cursor · OpenClaw",
        "Self-hosted inference",
        "Ollama · vLLM · LiteLLM",
        "Gateways & Routing",
      ],
    },
    {
      label: "Infra & Tooling",
      items: ["Docker · Docker Swarm", "CI/CD", "AWS · Vercel · Hetzner", "Sentry", "Git"],
    },
    {
      label: "Testing",
      items: ["Vitest", "Playwright", "MSW"],
    },
  ] satisfies CvSkillGroup[],

  experience: [
    {
      company: "ETL Group LLC",
      companyUrl: siteConfig.employer.url,
      role: "Full-stack Software Engineer",
      location: "Remote — US logistics",
      period: "May 2024 — Present",
      lead: "Lead / sole developer across a suite of products for US freight carriers and dispatchers.",
      bullets: [
        "ClaraHR — AI-powered driver onboarding system which contacts, onboards and files US truck drivers in the carrier's system with minimal HR involvement. Lead the project end-to-end, including infra and B2B communication. Onboarded 800+ drivers across 8 enterprise clients.",
        "CargoHub — freight marketplace where shippers & brokers browse trucks, post loads and book capacity, with an AI assistant handling routine dispatch. Sole dev. Handles ~2,500 trucks across 9 carriers.",
        "CargoFinance — accounting & light-fintech tooling for a logistics back-office: invoicing, transfer tracking and bank-rail payouts (AP/AR, reconciliation). Sole dev.",
        "CargoETL — closed TMS; built and maintain both the Next.js dispatcher dashboard and the React Native (Expo) driver app — order flow, live tracking, documents and dispatch comms.",
      ],
      stack: [
        "TypeScript",
        "Next.js",
        "NestJS",
        "Fastify",
        "React Native",
        "Expo",
        "PostgreSQL",
        "Prisma",
        "Redis",
        "BullMQ",
        "OpenAI",
        "DeepSeek",
        "Docker Swarm",
        "Plaid",
        "Twilio",
      ],
    },
    {
      company: "Altek Digital",
      companyUrl: "https://altek.digital",
      role: "Frontend / Mobile Engineer",
      location: "Remote — US logistics",
      period: "2022 — 2024",
      lead: "First multi-year production project — a TMS for US logistics carriers and dispatchers (since wound down).",
      bullets: [
        "Built the dispatcher dashboard and the driver mobile app: order flow, live tracking and dispatch comms.",
        "Worked across the Vue / Nuxt web stack and a React Native app shared by drivers in the field.",
      ],
      stack: ["Vue", "Nuxt", "JavaScript", "React Native"],
    },
  ] satisfies CvExperienceEntry[],

  education: {
    degree: "BSc Computer Science",
    school: "State University of Trade and Economics",
    schoolUrl: "https://sute.edu.ua/en",
    location: "Ukraine",
    period: "Expected 2028",
  } satisfies CvEducationEntry,

  languages: [
    { name: "English", level: "Fluent" },
    { name: "Ukrainian", level: "Native" },
    { name: "Russian", level: "Native" },
  ] satisfies CvLanguageEntry[],
} as const;

export type Cv = typeof cv;
