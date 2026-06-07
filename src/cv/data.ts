import { siteConfig } from "../config";

/**
 * CV content — English only, standalone from the i18n dictionary.
 *
 * Kept out of `src/i18n/locales/*` on purpose: the CV is a single English
 * artifact (US clients / recruiters), and folding it into the dictionary would
 * trip the locale-parity test and force ru/uk translations nobody asked for.
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

export const cv = {
  name: siteConfig.person.name,
  roleGeneral: "Software Engineer",
  roleDomain: "Applied AI",
  location: "Sofia, Bulgaria",
  availability: "Open to freelance & full-time — remote (US hours) or on-site in Sofia",

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
    "Full-stack TypeScript engineer with four years shipping production web & mobile systems for US logistics, HR and fintech operators. Comfortable owning a feature end-to-end — frontend, backend, infrastructure and deploy — with agentic AI woven into the day-to-day: I build the tooling, run self-hosted inference, and let agents handle the typing while I drive architecture, review and integration.",

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
        "Zustand · Redux Toolkit · MobX",
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
        "OpenAI · DeepSeek",
        "Self-hosted inference",
        "Ollama · vLLM · LiteLLM",
        "Gateways & routing",
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
        "ClaraHR — driver onboarding system where a chatbot interviews US truck drivers on their channel of choice and files them in the carrier's system. Lead the server side. 635 drivers across 8 carriers.",
        "CargoHub — public freight marketplace where shippers and brokers browse carriers' trucks, post loads and book capacity, with an in-product AI assistant handling routine dispatch. Sole developer. ~2,500 trucks across 9 carriers.",
        "CargoFinance — accounting & light-fintech tooling for a logistics back-office: invoicing, transfer tracking and bank-rail payouts (AP/AR, reconciliation). Sole developer.",
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

  languages: [
    { name: "English", level: "Fluent — daily, US clients" },
    { name: "Ukrainian", level: "Native" },
    { name: "Russian", level: "Native" },
  ] satisfies CvLanguageEntry[],
} as const;

export type Cv = typeof cv;
