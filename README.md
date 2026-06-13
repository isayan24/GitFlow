# 🚀 GitFlow (DevPulse)

**GitFlow** is a modern, automation-first developer tracking platform and project management SaaS. It bridges the gap between active code creation and manual project boards by converting GitHub activity (commits, pull requests, issues) directly into live, actionable dashboard metrics—completely eliminating the need for manual Jira or Trello ticket updates.

---

## The Vision

Project management shouldn't feel like a tax on code creation. Developers hate "double documenting"—having to push a fix to GitHub and then manually drag a ticket card from "In Progress" to "Done" in another application.

**GitFlow solves this by automating the pipeline:**

- **Git-Driven Automation:** Pushing code, opening pull requests, or closing issues on GitHub updates the project board instantly.
- **The Hybrid Workspace:** Non-code milestones (e.g., Figma designs, deployment reviews, copywriting) live side-by-side with automated GitHub tickets.
- **Zero-Friction Adoption:** Authenticate in seconds via Clerk + GitHub, import a repository, and stand up a fully populated metrics dashboard in under 10 seconds.

---

## 💎 Key Features

1.  **Frictionless Single-Button Onboarding**
    - Auth directly with your GitHub credentials via Clerk.
    - Search and filter public and private repositories in real-time, importing them with one click.

2.  **Automated Issues & PR Board**
    - Automatically maps GitHub Issues and PRs as task items.
    - Supports creating **manual/local task cards** for non-code objectives (e.g., design, copywriting, DevOps).
    - Filter task items instantly by status (`All`, `Open`, `Closed`) or search via query keywords.

3.  **Interactive Sub-task Steps Checklist**
    - Break down any issue, PR, or manual task card into smaller, actionable check-list steps.
    - Toggle steps as `DONE`/`PENDING` and upload or link **screenshot/image URLs** to individual steps for visual reference.

4.  **Per-Project Commit Heatmaps**
    - Dedicated 10-month (300-day) calendar heatmap showing commit frequency for *just* the opened repository, bypassing GitHub's global profile heatmap limitation.
    - Language ecosystem breakdown showing exact byte percentages and code color markers.

5.  **Analytics Center**
    - **Semantic Radar Profile**: Greedily classifies developer activity across 6 categories (`Features`, `Fixes`, `Refactoring`, `Testing`, `Documentation`, `Chores`) by parsing commit messages.
    - **Hourly/Weekly Punch Card**: Visual matrix showing the exact days and hours of high productivity/commits.
    - **Leaderboard**: Repository rankings by active commit counts in a rolling 30-day window.
    - **Commit Streak Tracking**: Keeps track of current and longest commit streaks, calculating across all imported repositories, combining cached database history with real-time GitHub commits (UTC-safe, DST-robust).

---

## 🛠️ Technology Stack

### Client (Frontend)
- **Framework:** TanStack Start (full-stack React with type-safe routing)
- **State Management:** TanStack Query (React Query)
- **Styling:** Vanilla CSS & Tailwind CSS
- **Visualizations:** Cal-Heatmap, Recharts, Lucide Icons

### Backend (API & Jobs)
- **Runtime:** Node.js & TypeScript
- **Server Framework:** Express
- **Database ORM:** Prisma
- **Database:** PostgreSQL (runs locally inside Docker Compose)
- **Authentication:** Clerk Auth

---

## 🚀 Local Development Setup

To get the client, backend, and local database running, follow these steps:

### Prerequisites
- Node.js (v18 or higher)
- Docker & Docker Compose

---

### 1. Database Setup

Launch the local PostgreSQL database using Docker Compose in the `backend/` directory:

```bash
cd backend
docker compose up -d
```

- This will spin up a PostgreSQL instance on port **`5433`** (customized to avoid conflicts with default system PostgreSQL databases).

---

### 2. Configure Environment Variables

#### Backend Configuration
Create a `.env` file in the `backend/` directory:
```bash
cp .env.example .env
```
Inside `backend/.env`, configure your credentials:
```env
PORT=5000
DATABASE_URL=postgresql://gitflow_user:gitflow_password@localhost:5433/gitflow_db?schema=public

# Clerk Credentials (optional for offline testing)
CLERK_PUBLISHABLE_KEY=pk_test_placeholder_key
CLERK_SECRET_KEY=sk_test_placeholder_key
```

#### Client Configuration
Create a `.env` file in the `client/` directory:
```bash
cd ../client
cp .env.example .env
```
Inside `client/.env`, configure the API endpoint and Clerk keys:
```env
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
VITE_API_URL=http://localhost:5000
```

---

### 3. Initialize Prisma (Backend)

Go back to the `backend/` directory, install dependencies, and sync the database schema:

```bash
cd ../backend
npm install
npx prisma db push
```

---

### 4. Run the Application

You need to run both the backend API and the client dev server.

#### Start the Backend API
```bash
cd backend
npm run dev
```
The server will start running on **`http://localhost:5000`**. You can verify connectivity by requesting:
```bash
curl http://localhost:5000/health
```

#### Start the Client Dev Server
In a new terminal window:
```bash
cd client
npm install
npm run dev
```
The web application will start running on **`http://localhost:3000`**.

---