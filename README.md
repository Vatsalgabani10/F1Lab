# F1Lab

F1Lab is a Formula 1 web app built with Next.js and Tailwind CSS.

It focuses on a cleaner, more visual F1 experience with:

- a homepage that introduces the sport with a stronger editorial layout
- a live-ish drivers page with standings refresh and driver portraits
- a season page that reads official F1 race/session data
- a tracks page with official circuit maps and richer track presentation

## Tech Stack

- Next.js
- React
- Tailwind CSS
- MongoDB
- Cheerio

## Run Locally

1. Install dependencies:

```bash
npm install
```

2. Create a local environment file:

```bash
.env.local
```

Add:

```env
MONGODB_URI=your_mongodb_connection_string
MONGODB_DB=f1lab
```

3. Start the development server:

```bash
npm run dev
```

4. Open:

```text
http://localhost:3000
```

## Available Scripts

```bash
npm run dev
npm run build
npm run start
npm run seed:seasons
```

## What The Website Is About

F1Lab is meant to make Formula 1 easier to explore visually.

Instead of feeling like a plain data dump, it presents:

- driver standings and team context
- official season and session information
- track maps and circuit summaries
- a more modern, premium motorsport UI

## Notes

- `.env.local`, `.next`, and `node_modules` are ignored from version control.
- Some standings and season data depend on external sources and may fall back when those sources are unavailable.
