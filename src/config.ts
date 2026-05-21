export const siteConfig = {
  googleAnalyticsId: "G-555D6RR3WR",
  contactEmail: "contact@bohdanmoroz.com",
  person: {
    givenName: "Bohdan",
    familyName: "Moroz",
    name: "Bohdan Moroz",
    alternateNames: ["Bogdan Moroz"],
  },
  githubUrl: "https://github.com/bohdanmoroz11",
  linkedinUrl: "https://www.linkedin.com/in/bohdan-moroz-dev/",
  employer: {
    name: "ETL Group LLC",
    url: "https://etlgroupllc.com",
  },
  knowsAbout: [
    "TypeScript",
    "React",
    "Next.js",
    "NestJS",
    "React Native",
    "Expo",
    "Node.js",
    "Applied AI",
    "Agentic AI workflows",
    "Large Language Models",
    "Self-hosted LLM inference",
    "Ollama",
    "vLLM",
    "LiteLLM",
    "Docker",
    "CI/CD",
    "Transportation Management Systems",
    "Freight logistics software",
    "HR onboarding software",
    "Fintech software",
  ],
} as const;

export const contactEmail = siteConfig.contactEmail;
export const mailtoContact = `mailto:${contactEmail}`;
