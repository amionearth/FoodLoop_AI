# Vercel Deployment Guide — FOODLOOP AI

This guide explains how to deploy the **FOODLOOP AI** frontend to Vercel in just a few clicks.

---

## 1. Quick One-Click Import

1. Go to [vercel.com](https://vercel.com) and log in with your GitHub account.
2. Click **"Add New..."** → **"Project"**.
3. Under **"Import Git Repository"**, select **`FoodLoop-AI`**.

---

## 2. Project Configuration on Vercel

The repository is already configured with a root `vercel.json` and root `package.json` with cross-platform build commands (`npm --prefix frontend run build`).

### Deployment Options:

#### Option A: Zero Configuration (Default Root)
Leave the **Root Directory** as `./` (default). Vercel will automatically read `vercel.json` and build the frontend.

#### Option B: Set Root Directory to `frontend` (Recommended by Vercel for monorepos)
In the project import screen:
1. Click **Edit** next to **Root Directory**.
2. Select or type **`frontend`**.
3. Framework Preset will automatically detect **Next.js**.

---

## 3. Environment Variables (Required on Vercel)

Under **Environment Variables**, add the following:

| Variable Name | Example Value | Description |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_API_BASE_URL` | `https://your-backend.onrender.com/api` | URL of your live FastAPI backend service |

*(For local development or testing without a live backend, it defaults to `http://localhost:8000/api`)*.

---

## 4. Deploying the Backend (Render / Railway / Fly.io)

Because FOODLOOP AI includes a FastAPI Python server with scikit-learn models:
1. Deploy the backend to a Python host such as **Render** (using `backend/requirements.txt` and start command `uvicorn backend.app.main:app --host 0.0.0.0 --port $PORT`).
2. Set the `DATABASE_URL` (e.g. Supabase PostgreSQL or Render PostgreSQL).
3. Copy the live backend URL and set it as `NEXT_PUBLIC_API_BASE_URL` in your Vercel project settings.

---

## 5. Continuous Deployment

Every time you push or publish commits to the `main` or `master` branch on GitHub, Vercel will automatically trigger a new deployment and preview link.
