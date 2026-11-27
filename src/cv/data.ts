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
  /** Short framing line shown above the bullet list (omitted when empty). */
  lead: string;
  bullets: string[];
  stack: string[];
}

export interface CvLanguageEntry {
  name: string;
  level: string;
}

export interface CvOpenSourceEntry {
  name: string;
  url: string;
  desc: string;
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
    "Full-stack TypeScript engineer with 4+ years shipping production systems for US logistics, HR and fintech operators, owning them end-to-end — frontend, backend, integrations, infra and deploy. Agentic AI is core to how I work: agents track, finish and verify their own work, and my time goes to architecture, review and decisions.",

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
        "Agentic workflows",
        "Claude Code · Codex · Orca",
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
      lead: "",
      bullets: [
        "CargoFinance — multi-tenant accounting back-office for US logistics carriers, live with 18 tenants and eight-figure freight volume: settlements, statements, commissions, payroll and payouts, integrated with NetSuite and Wells Fargo, with automated sync and migration pipelines and an AI copilot. Sole dev.",
        "ClaraHR — AI driver-onboarding system that interviews US truck drivers and files them in the carrier's system. Lead dev; 1,800+ drivers onboarded via 53K conversations for 9 carriers.",
        "CargoHub — freight marketplace where shippers & brokers browse trucks, post loads and book capacity, with an AI assistant handling routine dispatch. Sole dev. Handles ~2,500 trucks across 9 carriers.",
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
        "NetSuite",
        "Twilio",
      ],
    },
    {
      company: "Altek Digital",
      companyUrl: "https://altek.digital",
      role: "Frontend / Mobile Engineer",
      location: "Remote — US logistics",
      period: "2022 — 2024",
      lead: "First multi-year project — dispatcher dashboard and driver app for a US logistics TMS (wound down).",
      bullets: [],
      stack: [],
    },
  ] satisfies CvExperienceEntry[],

  openSource: [
    {
      name: "agent-tracking",
      url: "https://github.com/BohdanMoroz11/agent-tracking",
      desc: "agents keep context, finish and verify their own work; adopted by teammates.",
    },
    {
      name: "Upkeep",
      url: "https://github.com/BohdanMoroz11/upkeep",
      desc: "agent-reviewed major dependency upgrades with evidence-backed verdicts.",
    },
  ] satisfies CvOpenSourceEntry[],

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
