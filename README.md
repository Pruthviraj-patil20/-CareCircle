# CareCircle — Collaborative Family Care Management Platform

<div align="center">

![CareCircle Banner](https://img.shields.io/badge/CareCircle-Family%20Care%20Coordinator-6366f1?style=for-the-badge&logo=heart&logoColor=white)

**A secure, modern multi-tenant SaaS platform empowering families and caregivers to organize tasks, coordinate schedules, protect vital documents, and handle medical emergencies with unified clarity.**

[![Next.js 16](https://img.shields.io/badge/Next.js-16.3.4-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19.2.8-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Prisma ORM](https://img.shields.io/badge/Prisma-5.22-2D3748?style=flat-square&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![NextAuth v5](https://img.shields.io/badge/Auth.js-v5.0_beta-purple?style=flat-square&logo=auth0&logoColor=white)](https://authjs.dev/)
[![Inngest](https://img.shields.io/badge/Inngest-Workflows-000000?style=flat-square&logo=inngest&logoColor=white)](https://www.inngest.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16+-336791?style=flat-square&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

[Features](#-features--modules) • [Architecture](#-architecture) • [RBAC Matrix](#-role-based-access-control-rbac) • [Quick Start](#-quick-start) • [Environment Setup](#-environment-variables) • [Background Workflows](#-background-workflows-inngest) • [Deployment](#-deployment)

</div>

---

## 📌 Problem & Solution

Modern family caregiving is fragmented across scattered WhatsApp messages, sticky notes, lost medical binders, and missed appointment reminders. When unexpected emergencies or caregiving burnout occur, families struggle to delegate responsibilities or locate critical records.

**CareCircle** centralizes the chaos into an intuitive, secure digital hub designed for families of any size:
- **Zero Confusion**: Real-time task delegation with multi-tier overdue escalations.
- **Single Source of Truth**: Unified calendar syncing medical appointments, therapy visits, and school events.
- **Bank-Grade Document Vault**: Encrypted cloud storage with granular member-level download and edit permissions.
- **Prepared for the Unexpected**: Rapid emergency response center with 1-tap dial cards and vital care directives.
- **Fair Workload Balance**: Transparent, constructive analytics to prevent caregiver fatigue.

---

## 🚀 Features & Modules

### 1. Multi-Tenant Family Circles & Circle Switcher
- Create multiple family circles (e.g., *Elder Care*, *Immediate Family*, *Holiday Planning*).
- Seamless instant switcher in the sidebar preserving circle-specific context and state.
- Full multi-tenant data isolation guarded at database, server action, and proxy levels.

### 2. Multi-Channel Member Invitations
- Invite family members and trusted caregivers with defined roles (`OWNER`, `ADMIN`, `MEMBER`, `CAREGIVER`).
- Multi-channel instant sharing:
  - **WhatsApp**: Pre-formatted invite text with custom circle link.
  - **Instagram & Facebook**: Direct copy & deep-link sharing.
  - **Direct Link**: 1-click clipboard copy with cryptographically secure single-use tokens.
  - **Transactional Email**: Built-in email dispatch powered by **Resend** and **React Email**.
- Pending invitations manager with resend and revoke controls.

### 3. Task Management & Escalation Engine
- Assign responsibilities to one or multiple members with priorities (`LOW`, `MEDIUM`, `HIGH`, `URGENT`).
- Filter by assignee, status (`TODO`, `IN_PROGRESS`, `DONE`, `CANCELLED`), and due dates.
- Complete audit trail logging task assignment, status updates, and notes.
- **Automated Escalations**: Background Inngest worker monitors overdue critical tasks and triggers notifications to family administrators.

### 4. Interactive Family Calendar
- FullCalendar integration supporting Month, Week, and Day grid views.
- Color-coded categories: Medical, Therapy, School, Medication, Social, and Household.
- Event attendee management with reminders and date filtering.

### 5. Encrypted Document Vault & Expiry Alerts
- Securely store health insurance policies, medical histories, power of attorney, and deeds.
- Cloud storage via **AWS S3** / **Cloudflare R2** with automatic local disk fallback (`.storage/`) during local development.
- **Granular Permissions Matrix**: Assign per-member permissions (`VIEW`, `DOWNLOAD`, `EDIT`, `DELETE`).
- **Expiry Notification Engine**: Background daily cron checking document renewal dates (warnings at 30, 7, and 1 day out).

### 6. Emergency Preparedness Center
- Quick 1-tap call cards for national emergency lines (911/112), primary physicians, local hospitals, and poison control.
- Vital medical instructions: allergies, blood types, evacuation plans, and do-not-resuscitate (DNR) directives.
- Fast access directly from the dashboard for urgent situations.

### 7. Family Announcements & Discussion Feed
- Broadcast bulletins, schedule updates, and urgent alerts with high-visibility pinned posts.
- Real-time comment threads for collaborative decision-making.
- Read receipt tracking to verify which family members have acknowledged important announcements.

### 8. Workload Balance & Care Analytics
- Constructive, non-punitive analytics powered by **Recharts**.
- Visual breakdowns of completed tasks, active chore distributions, and 6-month historical trends.
- Identifies caregiver bottlenecks to encourage supportive delegation.

### 9. Dark Mode & Accessibility
- Native dark and light mode built with `next-themes` and Tailwind CSS v4 color tokens (OKLCH color space).
- High-contrast accessible typography (Geist Sans & Mono).

---

## 🏗 Architecture

CareCircle is built on modern Next.js 16 App Router architecture utilizing React 19 Server Components, Server Actions, and asynchronous background queues:

```mermaid
flowchart TD
    subgraph Client["Browser (Desktop / Mobile)"]
        UI["React 19 + Tailwind v4 UI"]
        Theme["Theme Provider & Lucide Icons"]
        FC["FullCalendar & Recharts"]
    end

    subgraph AppServer["Next.js 16 Application Server"]
        Proxy["Proxy & Route Middleware (proxy.ts)"]
        Auth["Auth.js v5 (NextAuth) - JWT & Google OAuth"]
        ServerActions["Secure Server Actions (Mutations & Zod Validations)"]
        RSC["React Server Components (Data Hydration)"]
    end

    subgraph Background["Event-Driven Worker (Inngest)"]
        CronDoc["Document Expiry Monitor"]
        CronEsc["Task Escalation Engine"]
        MailDispatch["Resend Transactional Dispatcher"]
    end

    subgraph StorageLayer["Data & File Infrastructure"]
        Prisma["Prisma ORM 5.x"]
        Postgres[("PostgreSQL Database")]
        S3[("AWS S3 / Cloudflare R2 Vault")]
        LocalStorage[("Local Vault (.storage/ fallback)")]
    end

    UI <--> Proxy
    Proxy --> RSC
    Proxy --> ServerActions
    ServerActions --> Auth
    ServerActions --> Prisma
    ServerActions --> Background
    RSC --> Prisma
    Prisma <--> Postgres
    ServerActions --> S3
    ServerActions -.-> LocalStorage
    Background --> ResendAPI["Resend Email API"]
    Background --> Prisma
```

---

## 🗄️ Database Schema & Entity Relationships

```mermaid
erDiagram
    User ||--o{ FamilyMember : "belongs to"
    User ||--o{ TaskAssignment : "assigned to"
    User ||--o{ Document : "uploads"
    User ||--o{ Announcement : "publishes"
    User ||--o{ Notification : "receives"

    Family ||--o{ FamilyMember : "contains"
    Family ||--o{ FamilyInvitation : "has pending"
    Family ||--o{ Task : "tracks"
    Family ||--o{ Event : "schedules"
    Family ||--o{ Document : "stores"
    Family ||--o{ Announcement : "broadcasts"
    Family ||--o{ EmergencyContact : "maintains"
    Family ||--o{ AuditLog : "records"

    Task ||--o{ TaskAssignment : "assigned to"
    Task ||--o{ TaskAuditLog : "audited by"

    Document ||--o{ DocumentPermission : "controlled by"
    Announcement ||--o{ AnnouncementComment : "has"
    Announcement ||--o{ AnnouncementRead : "read by"
```

---

## 🛡 Role-Based Access Control (RBAC)

CareCircle implements strict multi-level permissions for all members within a circle:

| Capability / Module | Circle `OWNER` | Circle `ADMIN` | Circle `MEMBER` | Circle `CAREGIVER` |
| :--- | :---: | :---: | :---: | :---: |
| **Manage Circle Settings & Delete Circle** | ✅ | ❌ | ❌ | ❌ |
| **Invite / Remove Family Members** | ✅ | ✅ | ❌ | ❌ |
| **Change Member Roles** | ✅ | ✅ (Non-Owner) | ❌ | ❌ |
| **Create & Assign Tasks** | ✅ | ✅ | ✅ | ✅ |
| **Manage Calendar Events** | ✅ | ✅ | ✅ | ✅ (Own/Assigned) |
| **Upload Documents to Vault** | ✅ | ✅ | ✅ | ❌ |
| **Manage Document Access Permissions** | ✅ | ✅ | ❌ | ❌ |
| **Publish Pinned Announcements** | ✅ | ✅ | ❌ | ❌ |
| **Comment & Acknowledge Announcements** | ✅ | ✅ | ✅ | ✅ |
| **Manage Emergency Contacts & Directives** | ✅ | ✅ | ❌ | ❌ |
| **View Emergency Response Cards** | ✅ | ✅ | ✅ | ✅ |
| **Access Workload & Analytics Insights** | ✅ | ✅ | ✅ | ❌ |

---

## 📂 Project Structure

```
CareCircle/
├── prisma/
│   ├── schema.prisma          # Database models, relations & enums
│   └── seed.ts                # Database seeder with demo family & credentials
├── public/                    # Static assets & brand icons
├── src/
│   ├── actions/               # Next.js Server Actions (Auth, Family, Tasks, Documents, Calendar)
│   ├── app/
│   │   ├── (auth)/            # Login, Registration, Password Reset, Invitations
│   │   ├── (dashboard)/       # Authenticated Dashboard Application Routes
│   │   │   ├── dashboard/
│   │   │   │   ├── analytics/     # Family care distribution & Recharts metrics
│   │   │   │   ├── announcements/ # Noticeboard, pinned feeds & read receipts
│   │   │   │   ├── calendar/      # Shared interactive FullCalendar
│   │   │   │   ├── documents/     # Encrypted document vault & permissions
│   │   │   │   ├── emergency/     # 1-tap dial cards & medical directives
│   │   │   │   ├── members/       # Roster, RBAC & multi-channel invite modal
│   │   │   │   ├── notifications/ # Notification center & unread triggers
│   │   │   │   ├── settings/      # Family circle switcher & profile configuration
│   │   │   │   ├── tasks/         # Task coordination, Kanban filters & escalation
│   │   │   │   └── page.tsx       # Main dashboard hub
│   │   │   └── layout.tsx         # Dashboard shell (Sidebar, Header & Navigation)
│   │   ├── api/
│   │   │   ├── auth/              # NextAuth route handlers
│   │   │   ├── inngest/           # Inngest webhook endpoint
│   │   │   └── documents/raw/     # Secure streaming endpoint for vault files
│   │   ├── globals.css            # Tailwind CSS v4 design tokens & theme layers
│   │   └── layout.tsx             # Root layout, Geist fonts, Toaster & ThemeProvider
│   ├── components/            # Modular React client & server components
│   │   ├── analytics/         # Recharts charts & metrics cards
│   │   ├── calendar/          # FullCalendar views & event dialogs
│   │   ├── documents/         # Uploaders, permissions manager & viewer
│   │   ├── family/            # Invite dialogs, switcher & roster tables
│   │   ├── layout/            # Responsive Sidebar, Header, Mobile Nav
│   │   ├── tasks/             # Task cards, forms, priority selectors & audit logs
│   │   └── ui/                # Shadcn / Base UI accessible primitives
│   ├── inngest/
│   │   ├── client.ts          # Inngest SDK client
│   │   └── jobs/              # Scheduled cron jobs & event listeners
│   ├── lib/
│   │   ├── auth.ts            # NextAuth v5 configuration & credentials provider
│   │   ├── db.ts              # Global Prisma client singleton
│   │   ├── permissions.ts     # RBAC verification helpers
│   │   ├── s3.ts              # AWS S3 / Cloudflare R2 presigned storage client
│   │   └── utils.ts           # Class merging (cn) & formatting utilities
│   ├── proxy.ts               # Next.js route protection & session redirection
│   └── types/                 # Shared TypeScript interfaces & declarations
├── .env.example               # Template environment configuration
├── next.config.ts             # Next.js framework configuration
├── package.json               # Dependencies & build scripts
├── postcss.config.mjs         # PostCSS configuration for Tailwind v4
└── tsconfig.json              # TypeScript compiler configuration
```

---

## ⚡ Quick Start

### Prerequisites

- **Node.js**: `v20.x` or higher
- **Package Manager**: `npm` (v10+), `pnpm`, or `yarn`
- **Database**: PostgreSQL database (local instance or cloud via [Neon](https://neon.tech), [Supabase](https://supabase.com), or [Railway](https://railway.app))

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/Pruthviraj-patil20/-CareCircle.git
cd -CareCircle
npm install
```

### 2. Configure Environment

Create your local configuration file:

```bash
cp .env.example .env.local
```

Fill in your database URL and generate a secure authentication secret:

```bash
# Generate a 32-character secret:
openssl rand -base64 32
```

*(See [Environment Variables](#-environment-variables) below for full configuration details).*

### 3. Initialize the Database

Run Prisma migrations to create the schema:

```bash
npx prisma migrate dev --name init
```

Seed the database with a pre-configured family circle, mock tasks, and demo credentials:

```bash
npx prisma db seed
```

### 4. Launch Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) in your browser.

#### Demo Credentials:
- **Email**: `test@carecircle.com`
- **Password**: `password123`
- **Default Role**: `OWNER` (*My Test Family*)

---

## ⚙️ Environment Variables

| Variable | Required | Description | Example / Default |
| :--- | :---: | :--- | :--- |
| `DATABASE_URL` | **Yes** | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/carecircle?schema=public` |
| `AUTH_SECRET` | **Yes** | Encryption key for Auth.js JWT sessions | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | **Yes** | Base canonical URL of the application | `http://localhost:3000` |
| `GOOGLE_CLIENT_ID` | Optional | Google Cloud Console OAuth Client ID | `your_id.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Optional | Google Cloud Console OAuth Client Secret | `GOCSPX-your_secret` |
| `RESEND_API_KEY` | Optional | Resend API key for sending live invite emails | `re_123456789` |
| `RESEND_FROM_EMAIL` | Optional | Verified sender address in Resend | `invites@yourdomain.com` |
| `INNGEST_EVENT_KEY` | Optional | Inngest event publishing key (`local` in dev) | `local` |
| `INNGEST_SIGNING_KEY` | Optional | Inngest signature verification key | `local` |
| `S3_ACCESS_KEY_ID` | Optional | S3 / Cloudflare R2 access key *(falls back to local disk)* | `AKIAIOSFODNN7EXAMPLE` |
| `S3_SECRET_ACCESS_KEY` | Optional | S3 / Cloudflare R2 secret key | `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY` |
| `S3_BUCKET_NAME` | Optional | S3 bucket name for vault storage | `carecircle-vault` |
| `S3_REGION` | Optional | S3 bucket region (use `auto` for Cloudflare R2) | `us-east-1` |
| `S3_ENDPOINT` | Optional | Custom endpoint for Cloudflare R2 / MinIO | `https://<account_id>.r2.cloudflarestorage.com` |

---

## 🔄 Background Workflows (Inngest)

CareCircle includes automated, durable background workflows powered by **Inngest**:

1. **Document Expiration Scanner** (`document-expiry.ts`):
   - Runs on a daily schedule.
   - Scans all family vaults for documents reaching expiration within 30, 7, and 1 day.
   - Generates in-app alerts and email warnings to ensure medical insurance or legal forms are renewed on time.

2. **Task Escalation Watchdog** (`escalation.ts`):
   - Monitors overdue tasks flagged as `HIGH` or `URGENT`.
   - Automatically notifies Circle Admins and Owners if critical care duties remain uncompleted.

3. **Notification Dispatcher** (`notifications.ts` & `reminders.ts`):
   - Dispatches transactional emails via Resend.
   - Distributes event and medical appointment reminders.

### Running Inngest Locally

To test background jobs and monitor event lifecycles in development, run the Inngest Dev Server:

```bash
npx inngest-cli@latest dev
```

Open the Inngest management dashboard at [http://localhost:8288](http://localhost:8288) to simulate events and trigger crons.

---

## 🧪 Testing & Code Quality

Verify TypeScript strict compliance, linting rules, and production bundling before submitting pull requests:

```bash
# 1. Type-check TypeScript codebase
npx tsc --noEmit

# 2. Run ESLint code quality & hooks analysis
npm run lint

# 3. Test production compilation & asset bundling
npm run build
```

---

## 🚢 Deployment

### Deploy to Vercel (Recommended)

CareCircle is architected for seamless zero-configuration deployment on **Vercel**:

1. Push your repository to **GitHub**.
2. Go to [Vercel Dashboard](https://vercel.com/new) and select **Import Project**.
3. Set the Framework Preset to **Next.js**.
4. In the **Environment Variables** section, add your production values:
   - `DATABASE_URL` (from Neon, Supabase, or AWS RDS)
   - `AUTH_SECRET`
   - `NEXTAUTH_URL` (`https://your-domain.vercel.app`)
   - `RESEND_API_KEY`
   - `S3_*` credentials for persistent document storage
   - `INNGEST_EVENT_KEY` & `INNGEST_SIGNING_KEY`
5. Configure the build script:
   - **Build Command**: `prisma generate && next build`
6. Click **Deploy**.

### Self-Hosted / Dockerized Deployment

To run CareCircle on a standalone VPS or container environment:

```bash
# 1. Build the production application
npm run build

# 2. Run database migrations in production
npx prisma migrate deploy

# 3. Start the Next.js production server
npm run start
```

Ensure your reverse proxy (Nginx, Caddy, or Traefik) routes traffic to port `3000` with SSL/TLS termination.

---

## 🔒 Security & Privacy

CareCircle handles sensitive family data, and is designed with defense-in-depth principles:
- **Tenant Isolation**: Every database query is scoped by `familyId` and guarded by server-side session checks.
- **Credential Protection**: Passwords hashed with salted `bcrypt` (10 rounds).
- **Vault Security**: Files in the vault are protected with pre-signed ephemeral URLs; direct public S3 bucket access is denied.
- **CSRF & Session Security**: HTTP-only, secure, SameSite cookies managed by NextAuth v5.
- **Granular Permissions**: Document access can be restricted to view-only or download-disabled per individual family member.

---

## 🤝 Contributing

Contributions from the community are warmly welcome! If you'd like to improve CareCircle:

1. **Fork the repository**.
2. **Create a feature branch**:
   ```bash
   git checkout -b feat/my-new-feature
   ```
3. **Commit your changes**:
   ```bash
   git commit -m "feat(tasks): add recurring chore cadence support"
   ```
4. **Push to the branch**:
   ```bash
   git push origin feat/my-new-feature
   ```
5. **Open a Pull Request** describing your changes and verification steps.

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

<div align="center">

Made with ❤️ for families and caregivers everywhere.

</div>
