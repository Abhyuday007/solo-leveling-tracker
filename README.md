# ⚔️ Solo Leveling Tracker

A gamified personal productivity app inspired by the Solo Leveling manhwa. Built with React Native + Expo, powered by Supabase for cloud sync and Gemini AI for intelligent task generation.

> *"Arise."* — Turn your daily grind into a leveling system.

---

## 📱 Install (Android)

Download and install the APK directly — no Play Store needed.

**[⬇ Download APK](./application-0b4d94d4-02b5-4da8-af81-6d3396b98b20.apk)**

1. Download the APK to your Android device
2. Enable **Install from unknown sources** in Settings → Security
3. Open the APK and install
4. Register with your email and start leveling

---

## 🚪 Gates (Screens)

### GATE 00 — Player Authentication
Login / Register screen. Email-based auth via Supabase. Sessions persist across app restarts.

### GATE 01 — Active Dungeons
Your daily task board. Describe a goal → the System (Gemini AI) breaks it down into 3 ranked Dungeons with XP rewards. Complete tasks to earn XP and level up.

- AI asks clarifying questions if your goal is too vague
- Tasks ranked: `E` → `C` → `B` → `A` → `S`
- XP: C=20 / B=40 / A=60 / S=100
- Level up every 200 XP

### GATE 02 — Master Archives
Long-term campaign tracker. Declare a campaign with a numeric target (e.g. "30LPA Tech Vanguard — 60 days"), tap cards to increment progress. Status flips to `CONQUERED` on completion.

### GATE 03 — Player Lore
Stats dashboard. Tracks your XP trajectory over the last 6 days and visualizes your Skill Tree split across three pillars:

| Ring | Keyword matches |
|------|----------------|
| 💪 Strength | gym, workout, run, squat, kg, press |
| 🧠 Intelligence | leetcode, code, AI, data, SQL, python, system |
| 🗣 Charisma | everything else (leadership, networking, etc.) |

---

## 🛠 Tech Stack

| Layer | Tech |
|-------|------|
| Framework | React Native (Expo ~56) |
| Language | TypeScript |
| Auth + DB | Supabase |
| AI | Google Gemini (`@google/generative-ai`) |
| Navigation | React Navigation (Bottom Tabs) |
| Charts | `react-native-chart-kit` (Line + Progress) |
| Gradients | `expo-linear-gradient` |
| Build | EAS Build |

---

## 🚀 Run Locally

### Prerequisites
- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)
- Android emulator or physical device

### Setup

```bash
git clone https://github.com/Abhyuday007/solo-leveling-tracker.git
cd solo-leveling-tracker
npm install
```

Create a `.env` file in the root:

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_GEMINI_API_KEY=your_gemini_api_key
```

### Supabase Schema

Create these two tables in your Supabase project:

```sql
-- Tasks (daily dungeons)
create table tasks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  title text not null,
  difficulty text not null,
  xp_reward int not null,
  is_completed boolean default false,
  created_at timestamp with time zone default now()
);

-- Campaigns (long-term goals)
create table campaigns (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  title text not null,
  target_progress int not null,
  current_progress int default 0,
  status text default 'ACTIVE',
  created_at timestamp with time zone default now()
);
```

Enable RLS and add policies for authenticated users on both tables.

### Start

```bash
npm start          # Expo dev server
npm run android    # Android emulator
npm run ios        # iOS simulator
```

---

## 📂 Project Structure

```
solo-leveling-tracker/
├── App.tsx                    # Root: auth check + tab navigator
├── supabase.ts                # Supabase client init
├── src/
│   ├── screens/
│   │   ├── Gate00_Login.tsx   # Auth screen
│   │   ├── Gate01_Dungeons.tsx# Daily tasks + AI generation
│   │   ├── Gate02_Archives.tsx# Long-term campaigns
│   │   └── Gate03_Lore.tsx    # Stats + charts
│   ├── components/
│   │   ├── QuestCard.tsx      # Task list item
│   │   └── SystemModal.tsx    # AI task generation modal (3-phase flow)
│   └── assets/                # AI-generated artwork
├── assets/                    # App icons + splash
├── app.json                   # Expo config
└── eas.json                   # EAS build config
```

---

## 🎨 Design Language

Pure black (`#000000`) background. White text. Minimal borders. All-caps letter-spaced labels. The aesthetic deliberately mirrors the System UI from the manhwa — cold, clinical, powerful.

---

## 📄 License

MIT
