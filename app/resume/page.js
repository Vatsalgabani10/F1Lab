export const metadata = {
  title: "Resume | F1Lab",
  description: "One-page ATS-friendly resume template aligned to job descriptions."
};

const coreSkills = [
  "JavaScript",
  "TypeScript",
  "React",
  "Next.js",
  "Node.js",
  "REST APIs",
  "MongoDB",
  "SQL",
  "Git",
  "CI/CD",
  "Testing",
  "Agile"
];

const jdKeywords = [
  "Problem solving",
  "System design",
  "Performance optimization",
  "Cross-functional collaboration",
  "Ownership",
  "Code quality"
];

const achievements = [
  "Built production-ready full-stack features end-to-end, reducing delivery cycle time by 30%.",
  "Improved application performance and cut key page load times by 35% through targeted optimization.",
  "Implemented reliable API integrations and data pipelines with robust error handling and observability.",
  "Led UI modernization efforts with reusable components, improving development speed and consistency."
];

const experience = [
  {
    role: "Software Engineer",
    company: "Your Company",
    period: "2024 - Present",
    bullets: [
      "Delivered scalable web features using React, Next.js, and Node.js across product-critical workflows.",
      "Designed and shipped APIs consumed by multiple internal and external clients with clear documentation.",
      "Partnered with product and design teams to translate business requirements into high-quality technical execution."
    ]
  },
  {
    role: "Software Developer",
    company: "Previous Company",
    period: "2022 - 2024",
    bullets: [
      "Developed and maintained customer-facing modules with strong focus on reliability and maintainability.",
      "Wrote testable, modular code and supported releases through CI/CD and incident response workflows."
    ]
  }
];

export default function ResumePage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-5 py-10 md:px-8 md:py-14">
      <section className="rounded-[1.5rem] border border-black/25 bg-white p-8 shadow-panel md:p-10">
        <header className="border-b border-black/15 pb-6">
          <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">Your Name</h1>
          <p className="mt-2 text-base text-muted">
            Software Engineer | City, State | email@domain.com | +1 (000) 000-0000 | linkedin.com/in/yourname
          </p>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-muted">
            Results-driven software engineer with experience building performant web applications and scalable backend services.
            Strong ownership mindset, clean coding practices, and product-focused execution.
          </p>
        </header>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <article className="rounded-2xl border border-black/15 bg-soft p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand">ATS Keywords</p>
            <p className="mt-3 text-sm text-ink">{coreSkills.join(" • ")}</p>
          </article>
          <article className="rounded-2xl border border-black/15 bg-soft p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand">JD Alignment</p>
            <p className="mt-3 text-sm text-ink">{jdKeywords.join(" • ")}</p>
          </article>
        </div>

        <section className="mt-7">
          <h2 className="text-sm font-semibold uppercase tracking-[0.24em] text-brand">Experience</h2>
          <div className="mt-3 space-y-5">
            {experience.map((item) => (
              <article key={`${item.role}-${item.company}`} className="rounded-2xl border border-black/10 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-xl font-semibold tracking-tight">{item.role}</h3>
                  <span className="text-sm text-muted">{item.period}</span>
                </div>
                <p className="mt-1 text-sm font-medium text-muted">{item.company}</p>
                <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-7 text-ink">
                  {item.bullets.map((bullet) => (
                    <li key={bullet}>{bullet}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-7">
          <h2 className="text-sm font-semibold uppercase tracking-[0.24em] text-brand">Key Achievements</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-7 text-ink">
            {achievements.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section className="mt-7 grid gap-4 md:grid-cols-2">
          <article className="rounded-2xl border border-black/10 p-4">
            <h2 className="text-sm font-semibold uppercase tracking-[0.24em] text-brand">Education</h2>
            <p className="mt-3 text-sm leading-7 text-ink">
              B.S. in Computer Science, Your University
            </p>
          </article>
          <article className="rounded-2xl border border-black/10 p-4">
            <h2 className="text-sm font-semibold uppercase tracking-[0.24em] text-brand">Certifications</h2>
            <p className="mt-3 text-sm leading-7 text-ink">
              Cloud / Backend / Frontend certifications (add yours here)
            </p>
          </article>
        </section>
      </section>
    </main>
  );
}
