# ReuseCampus ♻️🎓

> **A secure, high-performance Peer-to-Peer (P2P) campus marketplace engineered for college students to buy, sell, and donate engineering essentials with zero friction and zero commission.**

[![React](https://img.shields.io/badge/React-19.x-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Vercel](https://img.shields.io/badge/Frontend-Vercel-000000?logo=vercel&logoColor=white)](https://reusecampus.vercel.app/)
[![Render](https://img.shields.io/badge/Backend-Render-46E3B7?logo=render&logoColor=white)](https://render.com/)
[![CI Pipeline](https://img.shields.io/badge/CI-Passing%20(60%2F60)-brightgreen?logo=githubactions&logoColor=white)](https://github.com/abhishekpachori04-cpu/ReuseCampus/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## 🌐 Live Production Deployment

Experience the live application deployed across globally distributed edge infrastructure:

<div align="center">

### 🚀 **[Launch ReuseCampus Live Application](https://reusecampus.vercel.app/)**
**Production URL:** `https://reusecampus.vercel.app/`

*Frontend hosted on **Vercel Edge Network** &bull; Backend API powered by **Render Cloud Services** &bull; Persistent Cluster on **MongoDB Atlas***

</div>

---

## 💡 Overview & Problem Statement

Every semester across technical institutes like **Rustamji Institute of Technology (RJIT)**, passing seniors discard or store away expensive academic equipment—such as engineering drafters, higher mathematics textbooks, lab coats, and scientific calculators (e.g., Casio FX-991EX). Concurrently, incoming juniors spend substantial sums purchasing brand-new supplies from retail outlets.

Generic classifieds (OLX, Facebook Marketplace) introduce safety concerns, stranger fraud, high shipping fees, and unverified users. **ReuseCampus** resolves this by establishing a walled-garden, peer-to-peer micro-economy exclusively for verified college members, enabling secure same-day handoffs in campus hostels, academic blocks, and canteens.

---

## ⚡ Key Features (Engineering Highlights)

### 🛡️ Institutional Security & Verification
- **Domain-Enforced Gatekeeping**: Registration is strictly restricted to verified `@rjit.ac.in` student institutional email addresses via cryptographic regex and database validation, systematically blocking commercial resellers and bad actors.
- **3-Step Cryptographic Email OTP**: Implements secure 6-digit OTP delivery via Nodemailer with bcrypt-hashed token persistence, strict 10-minute time-to-live (TTL), attempt rate-limiting, and cooldown timers to prevent brute-force recovery attacks.

### ⚡ Zero-Blink UI Architecture
- **In-Memory Filtering & Memoization**: Eliminates layout shifts and infinite rendering loops on the Wishlist / Saved Items interface by decoupling ID normalization with React's `useMemo` pipeline.
- **Water-tight Reconciliation**: Missing bookmarked item IDs are reconciled asynchronously in the background while local state serves immediate, zero-latency cache hits with no screen flickering.

### 🚦 Resilient Cloud API & Defense-in-Depth
- **Proxy-Aware Rate Limiting**: Production Express API is configured with `app.set('trust proxy', 1)`, allowing `express-rate-limit` to inspect accurate client IPs forwarded by Render's reverse proxy without vulnerability to header spoofing.
- **Dual-Tier Throttling**: Employs global request throttling (150 requests / 15 minutes) alongside high-security auth throttling (15 requests / 15 minutes) on `/api/auth/*` endpoints.
- **NoSQL Injection Sanitization**: Custom recursive sanitation middleware strips rogue MongoDB evaluation operators (`$` and `.`) across `req.body`, `req.params`, and `req.query`.

### ☁️ Scalable Media Management
- **Cloudinary CDN Pipeline**: Seamless asset pipeline featuring multi-part image uploads through Multer directly streamed into Cloudinary.
- **Automated Compression & Delivery**: Automatic WebP transformation, responsive downscaling, and global CDN delivery to maximize load speeds on constrained mobile networks.

### 🧪 Automated Testing & CI Pipeline
- **60/60 Passing Backend Native Tests**: Native test suite executed through Node's built-in `node:test` and `node:assert/strict` harness—ensuring zero external test bloat, sub-second execution speeds, and comprehensive coverage across controllers, models, and auth guards.
- **GitHub Actions Integration**: Automated CI pipeline running on Ubuntu runners that lints frontend assets, verifies production bundle building, and executes backend test suites on every pull request and push to `main`.

---

## 🛠️ Tech Stack

| Domain | Technology | Purpose |
|---|---|---|
| **Frontend Framework** | **React 19** | Declarative, component-driven UI with Hooks (`useMemo`, `useCallback`) |
| **Build Tool** | **Vite** | Lightning-fast Hot Module Replacement (HMR) and optimized rollup production bundles |
| **Styling** | **Tailwind CSS v4** | Modern utility-first CSS styling engine with responsive design tokens |
| **Routing & Icons** | **React Router DOM 7** & **Lucide React** | Client-side routing and consistent iconography |
| **Backend Runtime** | **Node.js 18+** | High-concurrency event-driven asynchronous JavaScript engine |
| **Web Framework** | **Express.js 5.x** | Enterprise RESTful API layer with custom security middleware |
| **Database** | **MongoDB Atlas & Mongoose** | Distributed document database with compound indexing & `.lean()` query acceleration |
| **Authentication** | **JSON Web Tokens (JWT) & BcryptJS** | Stateless bearer token authentication & one-way salted password hashing |
| **Email Delivery** | **Nodemailer** | Transactional SMTP engine delivering HTML templates for OTP verification |
| **Media Storage** | **Cloudinary API & Multer** | Cloud-based media storage, dynamic optimization, and CDN delivery |
| **Cloud Hosting** | **Vercel** (Frontend) / **Render** (Backend) | Production hosting with automated Git deployments and HTTPS termination |

---

## 🏛️ System Architecture

```mermaid
flowchart TD
    subgraph Client ["Client Layer (React 19 + Tailwind CSS)"]
        UI["React SPA (Vite)"]
        State["AuthContext & useMemo Cache"]
        Axios["Axios Interceptor (Bearer JWT + Auto 401 Handler)"]
        UI --> State --> Axios
    end

    subgraph Edge ["Edge & Reverse Proxy"]
        VercelCDN["Vercel Global CDN"]
        RenderProxy["Render Reverse Proxy (trust proxy: 1)"]
    end

    subgraph Backend ["Backend API (Express.js on Node.js)"]
        Security["Helmet & CORS & NoSQL Sanitizer"]
        Limiter["Express Rate Limiting"]
        AuthGuard["JWT Authentication Guard"]
        Router["Express REST Routes (/auth, /listings, /users)"]
        
        Security --> Limiter --> AuthGuard --> Router
    end

    subgraph External ["Managed Cloud Services"]
        Mongo[("MongoDB Atlas Database")]
        Cloudinary[("Cloudinary Asset CDN")]
        SMTP["Nodemailer SMTP Gateway"]
    end

    VercelCDN -.-> UI
    Axios -->|HTTPS / REST| RenderProxy
    RenderProxy --> Backend
    Router -->|Mongoose Queries (.lean)| Mongo
    Router -->|Image Pipeline| Cloudinary
    Router -->|OTP / Transactional Email| SMTP
```

---

## 💻 Local Setup Instructions

Follow these instructions to run ReuseCampus locally on your development machine.

### Prerequisites
- [Node.js](https://nodejs.org/) (v18.0.0 or higher recommended)
- [Git](https://git-scm.com/)
- A free [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) cluster (or local MongoDB server)
- A [Cloudinary](https://cloudinary.com/) account for image uploads

---

### Step 1: Clone the Repository
```bash
git clone https://github.com/abhishekpachori04-cpu/ReuseCampus.git
cd ReuseCampus
```

---

### Step 2: Configure & Run Backend Service

1. Navigate to the backend directory and install dependencies:
   ```bash
   cd backend
   npm install
   ```

2. Initialize your local environment file:
   ```bash
   cp .env.example .env
   ```
   *(Update `.env` with your MongoDB connection string, JWT secret, and Cloudinary credentials as detailed below).*

3. Start the backend development server:
   ```bash
   npm run dev
   ```
   *The backend will boot up at `http://localhost:5000`.*

---

### Step 3: Configure & Run Frontend Application

1. Open a new terminal window, navigate to the frontend directory, and install dependencies:
   ```bash
   cd frontend
   npm install
   ```

2. Initialize the frontend environment file:
   ```bash
   cp .env.example .env
   ```

3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   *The frontend application will be live at `http://localhost:5173`.*

---

### Step 4: Run Automated Test Suite

ReuseCampus includes a comprehensive native test suite covering institutional validation, security rules, controllers, and error handling:

```bash
cd backend
npm test
```

> **Result:** `60/60 tests passing` with zero external test dependencies via Node's native test harness.

---

## 🔐 Environment Variables

The project uses `.env` files to separate configuration from codebase. Below is a specification of required configuration keys:

### Backend Configuration (`backend/.env`)

| Variable Name | Required | Description | Example / Format |
|---|---|---|---|
| `PORT` | Optional | Port on which the Express server listens (defaults to `5000`) | `5000` |
| `NODE_ENV` | Yes | Runtime environment flag | `development` / `production` / `test` |
| `MONGO_URI` | Yes | MongoDB Atlas connection string URI | `mongodb+srv://<user>:<pwd>@cluster0.mongodb.net/<db>?retryWrites=true&w=majority` |
| `JWT_SECRET` | Yes | Cryptographic secret key used for signing JWT tokens | `your_super_secret_jwt_key_min_32_chars` |
| `CLIENT_URL` | Yes | Allowed frontend origin for CORS access policies | `http://localhost:5173` |
| `ALLOWED_COLLEGE_DOMAIN`| Yes | Approved academic email domain for campus gatekeeping | `rjit.ac.in` |
| `ALLOWED_EMAIL_DOMAINS` | Optional | Secondary alias list for allowed institutional domains | `rjit.ac.in` |
| `CLOUDINARY_CLOUD_NAME` | Yes | Cloudinary cloud account name | `your_cloudinary_cloud_name` |
| `CLOUDINARY_API_KEY` | Yes | Cloudinary public API key | `your_cloudinary_api_key` |
| `CLOUDINARY_API_SECRET` | Yes | Cloudinary private API secret | `your_cloudinary_api_secret` |
| `SMTP_HOST` | Optional | SMTP mail host (defaults to `smtp.gmail.com`) | `smtp.gmail.com` |
| `SMTP_PORT` | Optional | SMTP network port (defaults to `587`) | `587` / `465` |
| `SMTP_USER` | Optional | SMTP authentication email address | `student-council@rjit.ac.in` |
| `SMTP_PASS` | Optional | SMTP app password or credential token | `your_smtp_app_password` |

### Frontend Configuration (`frontend/.env`)

| Variable Name | Required | Description | Example / Format |
|---|---|---|---|
| `VITE_API_URL` | Yes | Full base URL pointing to the active backend API | `http://localhost:5000/api` |

---

## 📡 API Reference Overview

All private routes require an `Authorization: Bearer <JWT>` header.

| Domain | Method | Endpoint | Access | Functionality |
|---|---|---|---|---|
| **Health** | `GET` | `/api/health` | Public | System uptime & health diagnostics |
| **Auth** | `POST` | `/api/auth/register` | Public | Register student with `@rjit.ac.in` email |
| **Auth** | `POST` | `/api/auth/login` | Public | Authenticate user and receive JWT bearer token |
| **Auth** | `POST` | `/api/auth/forgot-password` | Public | Request 6-digit verification OTP |
| **Auth** | `POST` | `/api/auth/verify-otp` | Public | Validate OTP and issue single-use reset token |
| **Auth** | `POST` | `/api/auth/reset-password` | Public | Reset password using verified token |
| **Auth** | `GET` | `/api/auth/me` | Protected | Fetch current student identity |
| **Listings** | `GET` | `/api/listings` | Public | Search, paginate, and filter campus items |
| **Listings** | `GET` | `/api/listings/:id` | Public | Retrieve single listing with seller contact |
| **Listings** | `POST` | `/api/listings` | Protected | Create new listing with Cloudinary upload |
| **Listings** | `PUT` | `/api/listings/:id` | Protected (Owner) | Modify listing details or pricing |
| **Listings** | `DELETE`| `/api/listings/:id` | Protected (Owner) | Remove listing and purge from all wishlists |
| **Listings** | `PATCH`| `/api/listings/:id/status`| Protected (Owner) | Mark listing as `Available` or `Sold` |
| **Listings** | `GET` | `/api/listings/my` | Protected (Owner) | Retrieve all listings owned by logged-in student |
| **Users** | `GET` | `/api/users/me` | Protected | Fetch student profile and marketplace statistics |
| **Users** | `PUT` | `/api/users/me` | Protected | Update profile metadata and WhatsApp phone |

---

## 📄 License

This repository is distributed under the **[MIT License](LICENSE)**.

```
Copyright (c) 2026 Abhishek Pachori

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
```

---

<div align="center">
  <sub>Engineered with precision for the student community of <b>Rustamji Institute of Technology (RJIT)</b>.</sub>
</div>
