"use client";

import { useState } from "react";

const sourceImage =
  "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/Williams_FW38_top_2017_Williams_Conference_Centre.jpg/1280px-Williams_FW38_top_2017_Williams_Conference_Centre.jpg";

const carParts = [
  {
    id: "front-wing",
    name: "Front Wing",
    category: "Aero surface",
    summary: "First contact with airflow and one of the main tools for front-end balance.",
    detail:
      "The front wing shapes the airflow feeding the rest of the car. It produces front downforce while also controlling how air is directed around the front tires and toward the floor.",
    bullets: ["Builds front downforce", "Controls aero balance", "Manages airflow around the tires"],
    point: { x: "14%", y: "53%" },
    label: { x: "14%", y: "84%" }
  },
  {
    id: "nose",
    name: "Nose And Chassis",
    category: "Core structure",
    summary: "The carbon-fiber survival cell forms the main structural backbone of the car.",
    detail:
      "The nose and chassis connect the front wing and suspension to the driver cell. This area is safety-critical, structurally rigid, and carefully shaped to feed clean airflow rearward.",
    bullets: ["Carbon-fiber crash structure", "Connects front end to cockpit", "Key safety and packaging zone"],
    point: { x: "33%", y: "53%" },
    label: { x: "24%", y: "68%" }
  },
  {
    id: "front-suspension",
    name: "Front Suspension",
    category: "Mechanical platform",
    summary: "Controls the front tires' contact patch, ride behavior, and braking stability.",
    detail:
      "The front suspension supports the front axle and controls how the car reacts under braking, turn-in, and over bumps or curbs. Geometry and stiffness choices affect both confidence and tire behavior.",
    bullets: ["Supports turn-in stability", "Controls front tire load", "Influences braking feel"],
    point: { x: "28%", y: "43%" },
    label: { x: "37%", y: "17%" }
  },
  {
    id: "cockpit",
    name: "Cockpit And Halo",
    category: "Driver cell",
    summary: "The strongest safety zone of the car and the center of driver control.",
    detail:
      "The cockpit contains the driver, steering wheel, and control systems, while the halo protects the driver's head from major impacts and debris. It is the core human interface of the car.",
    bullets: ["Primary driver safety cell", "Contains steering and controls", "Halo protects the driver"],
    point: { x: "51%", y: "46%" },
    label: { x: "55%", y: "12%" }
  },
  {
    id: "floor",
    name: "Floor",
    category: "Ground effect",
    summary: "One of the largest downforce-producing zones on a modern F1 car.",
    detail:
      "The floor accelerates airflow beneath the car to generate low pressure and large amounts of downforce. Ride height and platform control are crucial because this area works in a narrow performance window.",
    bullets: ["Huge source of downforce", "Sensitive to ride height", "Central to high-speed grip"],
    point: { x: "53%", y: "67%" },
    label: { x: "51%", y: "96%" }
  },
  {
    id: "sidepods",
    name: "Sidepods And Cooling",
    category: "Packaging",
    summary: "Packages cooling hardware while shaping airflow to the rear of the car.",
    detail:
      "Sidepods house radiators and cooling systems, but they are also major aerodynamic surfaces. Their contours help direct air toward the floor edge, beam wing, and diffuser.",
    bullets: ["Carries cooling hardware", "Shapes rearward airflow", "Combines packaging with aero"],
    point: { x: "63%", y: "53%" },
    label: { x: "70%", y: "62%" }
  },
  {
    id: "power-unit",
    name: "Power Unit",
    category: "Hybrid propulsion",
    summary: "The engine, turbo, battery systems, and energy recovery sit behind the driver.",
    detail:
      "The power unit combines combustion and hybrid systems into a tightly packaged rear section. Cooling, reliability, and energy deployment all affect acceleration and overall race pace.",
    bullets: ["Hybrid engine package", "Energy recovery systems", "Critical for efficiency and driveability"],
    point: { x: "59%", y: "40%" },
    label: { x: "70%", y: "12%" }
  },
  {
    id: "rear-suspension",
    name: "Rear Suspension",
    category: "Traction control",
    summary: "Supports traction, rear stability, and how the car accepts power on exit.",
    detail:
      "The rear suspension works with the rear tires, floor, and diffuser to stabilize the platform under acceleration. It is central to traction and corner-exit behavior.",
    bullets: ["Helps traction on exit", "Stabilizes the rear platform", "Works with diffuser and tires"],
    point: { x: "73%", y: "61%" },
    label: { x: "88%", y: "84%" }
  },
  {
    id: "rear-wing",
    name: "Rear Wing And Diffuser",
    category: "Rear aero",
    summary: "Rear downforce generator and a major influence on stability and drag.",
    detail:
      "The diffuser expands the airflow leaving the floor, while the rear wing adds rear stability and downforce. Together they define how planted the rear feels and how much drag is produced.",
    bullets: ["Adds rear stability", "Works with the diffuser", "Trade-off between grip and drag"],
    point: { x: "82%", y: "53%" },
    label: { x: "90%", y: "58%" }
  }
];

function CarPhoto({ activePart, onSelect }) {
  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-line bg-white p-4 md:p-6">
      <div className="relative mx-auto max-w-5xl">
        <img
          src={sourceImage}
          alt="Top view of a Williams FW38 Formula 1 car with labeled hotspots"
          className="block w-full rounded-[1.5rem] object-contain"
          loading="eager"
          referrerPolicy="no-referrer"
        />

        {carParts.map((part) => (
          <button
            key={part.id}
            type="button"
            onMouseEnter={() => onSelect(part.id)}
            onFocus={() => onSelect(part.id)}
            onClick={() => onSelect(part.id)}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: part.point.x, top: part.point.y }}
            aria-label={part.name}
          >
            <span className="relative flex h-8 w-8 items-center justify-center">
              <span
                className={`absolute h-8 w-8 rounded-full ${
                  activePart.id === part.id ? "bg-brand/20" : "bg-white/40"
                }`}
              />
              <span
                className={`absolute h-4 w-4 rounded-full border-2 ${
                  activePart.id === part.id
                    ? "border-brand bg-brand"
                    : "border-white bg-ink/70"
                }`}
              />
            </span>
          </button>
        ))}

        {carParts.map((part) => (
          <button
            key={`${part.id}-label`}
            type="button"
            onMouseEnter={() => onSelect(part.id)}
            onFocus={() => onSelect(part.id)}
            onClick={() => onSelect(part.id)}
            className={`absolute hidden -translate-x-1/2 -translate-y-1/2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] md:block ${
              activePart.id === part.id
                ? "border-brand bg-brand text-white"
                : "border-line bg-white/95 text-muted hover:border-brand hover:text-brand"
            }`}
            style={{ left: part.label.x, top: part.label.y }}
          >
            {part.name}
          </button>
        ))}
      </div>

      <p className="mt-4 text-xs leading-6 text-muted">
        Image source:{" "}
        <a
          href="https://commons.wikimedia.org/wiki/File:Williams_FW38_top_2017_Williams_Conference_Centre.jpg"
          target="_blank"
          rel="noreferrer"
          className="underline"
        >
          Williams FW38 top 2017 Williams Conference Centre
        </a>{" "}
        by Morio, licensed under{" "}
        <a
          href="https://creativecommons.org/licenses/by-sa/4.0/"
          target="_blank"
          rel="noreferrer"
          className="underline"
        >
          CC BY-SA 4.0
        </a>
        .
      </p>
    </div>
  );
}

export default function CarExplorer() {
  const [activeId, setActiveId] = useState(carParts[0].id);
  const activePart = carParts.find((part) => part.id === activeId) ?? carParts[0];

  return (
    <section className="mx-auto w-full max-w-7xl px-5 py-10 md:px-8">
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand">
          Interactive Car Guide
        </p>
        <h2 className="mt-2 text-4xl font-semibold tracking-tight">
          Hover over the car to see how each major part shapes performance.
        </h2>
        <p className="mt-4 max-w-3xl text-base leading-8 text-muted">
          This section now uses a real Formula 1 car image with interactive hotspots
          instead of a synthetic drawing.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <CarPhoto activePart={activePart} onSelect={setActiveId} />

        <aside className="rounded-[2rem] border border-line bg-ink p-6 text-white shadow-panel md:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-red-300">
            {activePart.category}
          </p>
          <h3 className="mt-3 text-3xl font-semibold tracking-tight">{activePart.name}</h3>
          <p className="mt-4 text-base leading-8 text-white/75">{activePart.summary}</p>

          <div className="mt-6 rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
            <p className="text-xs uppercase tracking-[0.22em] text-white/45">Detail</p>
            <p className="mt-3 text-sm leading-8 text-white/80">{activePart.detail}</p>
          </div>

          <div className="mt-6 grid gap-3">
            {activePart.bullets.map((bullet) => (
              <div
                key={bullet}
                className="rounded-[1rem] border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80"
              >
                {bullet}
              </div>
            ))}
          </div>
        </aside>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-3 xl:grid-cols-5">
        {carParts.map((part) => (
          <button
            key={part.id}
            type="button"
            onMouseEnter={() => setActiveId(part.id)}
            onFocus={() => setActiveId(part.id)}
            onClick={() => setActiveId(part.id)}
            className={`rounded-[1.25rem] border px-4 py-4 text-left transition ${
              activeId === part.id
                ? "border-brand bg-brand text-white"
                : "border-line bg-white text-ink hover:border-brand"
            }`}
          >
            <p
              className={`text-[11px] uppercase tracking-[0.22em] ${
                activeId === part.id ? "text-white/70" : "text-muted"
              }`}
            >
              {part.category}
            </p>
            <p className="mt-2 text-lg font-semibold tracking-tight">{part.name}</p>
          </button>
        ))}
      </div>
    </section>
  );
}
