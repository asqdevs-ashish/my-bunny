# 👩‍🍳 Suar's Kitchen 💕

A personalized **AI Food, Recipe & Wellness** companion built with ❤️.

Track meals, log moods, get AI-powered recipe suggestions, stay hydrated, and receive daily love notes — all in one beautiful app.

## ✨ Features

- **🤖 AI Chef Chat** — Hinglish-speaking AI that suggests recipes based on your mood, budget, and available ingredients
- **🍽️ Meal Logger** — Track home-cooked & outside meals with cost and ingredients
- **😊 Mood Tracker** — Log how you're feeling (Happy/Stressed/Tired/Productive)
- **💧 Hydration Tracker** — 8-glass daily water goal with progress ring
- **💌 Daily Love Notes** — Fresh romantic messages every day
- **📊 Weekly Summary** — Meal stats, spending, mood trends, and bar charts
- **🔔 Push Notifications** — Water, meal, love note, and mood check reminders
- **🎥 Quick Recipes** — Embedded YouTube recipe videos
- **🌙 Dark Mode** — Beautiful light/dark theme toggle

## 🚀 Tech Stack

| Tech | Purpose |
|------|---------|
| **Next.js 16** | React framework (App Router) |
| **TypeScript** | Type safety |
| **Tailwind CSS v4** | Styling |
| **Prisma + PostgreSQL** | Database |
| **NextAuth v5** | Authentication |
| **Google Gemini 2.0 Flash** | AI Chef |
| **next-themes** | Dark mode |
| **Lucide React** | Icons |

## 🛠️ Getting Started

### 1. Clone & Install

```bash
git clone <repo-url>
cd suar
npm install
```

### 2. Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

Required variables:
- `DATABASE_URL` — PostgreSQL connection string
- `GF_EMAIL` — Login email
- `GF_PASSWORD` — Login password (plaintext or bcrypt hash)
- `NEXTAUTH_SECRET` — Auth secret (`openssl rand -base64 32`)
- `NEXTAUTH_URL` — App URL (e.g., `http://localhost:3000`)
- `GOOGLE_GENERATIVE_AI_API_KEY` — Google Generative AI API key (get from [Google AI Studio](https://aistudio.google.com/))

### 3. Database Setup

```bash
npx prisma generate
npx prisma db push
```

### 4. Run

```bash
npm run dev
```

## 🌐 Deployment (Vercel)

1. Push to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Add all environment variables from `.env.example`
4. Deploy!

## 📁 Project Structure

```
├── app/                    # Next.js App Router pages & API
│   ├── api/                # REST API routes
│   ├── chat/               # AI Chat page
│   ├── dashboard/          # Main dashboard
│   └── login/              # Auth page
├── components/             # React components
│   └── ui/                 # Base UI components (Button, Card, Input)
├── lib/                    # Shared utilities
├── prisma/                 # Database schema
├── public/                 # Static assets (icons, service worker)
└── middleware.ts           # Auth middleware
```

---

Made with 💕 for that special someone.
