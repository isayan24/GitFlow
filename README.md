# 🚀 GitFlow

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
2.  **The Hybrid Kanban Board**
    - Automatically maps GitHub Issues and PRs as project board cards.
    - Supports manual task creation for non-code objectives.
    - Unified task tracking states (`To Do`, `In Progress`, `Completed`).
3.  **Flexible Assignments**
    - Group multiple tasks together into named "Assignments" (e.g., _"Sprint 1 Frontend Rebuild"_, _"Database Migration & Security"_).
4.  **Per-Project Commit Heatmaps**
    - Bypasses GitHub's global heatmap limitation by rendering a dedicated 365-day green calendar heatmap for _just_ the opened repository.
5.  **Analytics Center**
    - Code velocity tracking and Pull Request health metrics.
    - Language ecosystem breakdown showing the primary coding languages in your codebase.
6.  **Optimistic UI & Real-Time Sync**
    - UI state updates instantly before the database responds for a desktop-class user experience.

---

## 🛠️ Technology Stack

### Client (Frontend)

- **Framework:** TanStack Start (full-stack React with type-safe routing)
- **State Management:** TanStack Query (React Query)
- **Styling:** Tailwind CSS

### Backend (API & Jobs)

- **Runtime:** Node.js & TypeScript
- **Server Framework:** Express
- **Database ORM:** Prisma
- **Database:** PostgreSQL (runs locally inside Docker Compose)
- **Authentication:** Clerk Auth

---

## 🚀 Local Development Setup

To get the backend and local database running, follow these steps:

### Prerequisites

- Node.js (v18 or higher)
- Docker & Docker Compose

### 1. Database Setup

Launch the local PostgreSQL database using Docker Compose:

```bash
cd backend
docker compose up -d
```

- This will spin up a PostgreSQL instance on port **`5433`** (customized to avoid conflicts with default system PostgreSQL databases).

### 2. Configure Environment Variables

Create a `.env` file in the `backend/` directory:

```bash
cp .env.example .env
```

Inside `.env`, verify your connection credentials:

```env
PORT=5000
DATABASE_URL=postgresql://gitflow_user:gitflow_password@localhost:5433/gitflow_db?schema=public

# Clerk Credentials (optional for offline testing)
CLERK_PUBLISHABLE_KEY=pk_test_placeholder_key
CLERK_SECRET_KEY=sk_test_placeholder_key
```

### 3. Initialize Prisma

Install dependencies and sync the database schema:

```bash
npm install
npx prisma db push
```

### 4. Run the Backend API

Start the TypeScript live-reload dev server:

```bash
npm run dev
```

The server will start running on **`http://localhost:5000`**. You can verify connectivity by requesting:

```bash
curl http://localhost:5000/health
```

---

## 💡 Clerk Offline Dev Mode

If Clerk keys are not configured in your `.env` file (or left as `placeholder_key` values), the backend will automatically enter **Mock Dev Mode**.

- Public routes (like `/health`) will bypass Clerk checks.
- Protected routes requiring authentication will automatically mock an offline developer profile in the local database (`gitflow_mock_developer`).
- This allows you to immediately test, write routes, and query data without needing external internet access or creating an online Clerk account.
