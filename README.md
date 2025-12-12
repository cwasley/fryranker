# FryRanker

The Definitive Fry Rankings - A fun web app to rank your favorite fast food fries through head-to-head matchups.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: Vercel Postgres
- **Styling**: CSS with CSS Variables

## Features

- 🍟 Head-to-head fry matchups
- 📊 ELO-based ranking system
- 🌍 **Global leaderboard** - see what everyone thinks
- 🧠 **Personal taste profile** - track your own preferences (stored locally)
- ⌨️ Keyboard shortcuts (← → to vote, Space to skip)
- 📱 Responsive design

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Set up Vercel Postgres

1. Go to your [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project → **Storage** tab
3. Click **Create Database** → **Postgres**
4. Name it (e.g., `fryranker-db`) and create
5. Go to the `.env.local` tab and copy the environment variables
6. Create a `.env.local` file in your project root and paste them

Your `.env.local` should look like:
```
POSTGRES_URL="postgres://..."
POSTGRES_PRISMA_URL="postgres://..."
POSTGRES_URL_NO_SSL="postgres://..."
POSTGRES_URL_NON_POOLING="postgres://..."
POSTGRES_USER="..."
POSTGRES_HOST="..."
POSTGRES_PASSWORD="..."
POSTGRES_DATABASE="..."
```

### 3. Initialize the database

```bash
npm run db:init
```

This creates the `fries` table and populates it with initial data.

### 4. Run development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment

1. Push to GitHub
2. Import to Vercel
3. The database will automatically connect (env vars are already set)
4. After first deploy, run `npm run db:init` with your Vercel env vars to initialize the database

## How It Works

- **Global Standings**: Stored in Vercel Postgres. Every vote updates the global ELO scores.
- **Your Taste Profile**: Stored in localStorage. Tracks your personal preferences separately from the global rankings.

