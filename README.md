# CareCircle — Collaborative Family Care Management Platform

CareCircle is a secure, collaborative family operations and caregiver coordination platform. It unites family members, caregivers, and medical contacts under an unified digital dashboard to manage tasks, coordinate shared calendars, store encrypted vital documents, broadcast announcements, handle emergency medical procedures, and track family care distribution with actionable analytics.

---

## 1. Project Overview

Modern family caregiving is complex, fragmented across WhatsApp chats, paper binders, and scattered calendar invites. CareCircle centralizes essential household care operations into a secure multi-tenant system designed for families of any size.

### Key Capabilities

- **Multi-Tenant Family Circles & Role-Based Access Control (RBAC)**: Create or switch between multiple family circles with distinct permissions (`OWNER`, `ADMIN`, `MEMBER`).
- **Care Coordination Tasks & Delegation**: Assign tasks to multiple family members, track priority and due dates, log audit history, and trigger multi-level escalation alarms if vital care duties are overdue.
- **Shared Interactive Calendar**: Day, week, and month scheduling for medical appointments, travel, school, and renewals with color-coded categories and participant tracking.
- **Encrypted Family Vault & Document Permissions**: Securely store insurance cards, deeds, medical history, and records. Configure granular access controls (`VIEW`, `DOWNLOAD`, `EDIT`, `DELETE`) per family member with automatic expiry tracking.
- **Announcements & Discussion Feed**: Pin critical bulletins, broadcast schedule updates, track reader receipts, and discuss care updates with real-time commenting.
- **Emergency Preparedness Center**: Quick one-tap dialing for national and local emergency services, primary physicians, and insurance contacts. Securely maintain sensitive medical directives and evacuation instructions.
- **Family Workload Analytics**: Collaborative visualization of chore distributions, overdue bottlenecks, completion rates, and historical 6-month trends without shame-based metrics.
- **Enterprise Security & Audit Logging**: Immutable audit logs for compliance, security headers (CSP, HSTS, X-Frame-Options), CSRF protection, and zero-trust cross-tenant isolation.
- **Automated Reminders & Background Escalations**: Inngest-powered durable workflow execution for document expiry warnings, task escalations, and transactional email notifications via Resend.

---

## 2. Tech Stack

- **Framework**: [Next.js 16 (App Router)](https://nextjs.org/) with React 19 & TypeScript
- **Styling & UI**: Tailwind CSS v4, Lucide Icons, Framer Motion, Radix / Base UI primitives
- **Database**: PostgreSQL (compatible with Neon, Supabase, AWS RDS, Railway)
- **ORM**: [Prisma ORM 5.x](https://www.prisma.io/)
- **Authentication**: [NextAuth.js v5 (Auth.js)](https://authjs.dev/) with Credentials & Google OAuth
- **Background Jobs & Workflows**: [Inngest 4.x](https://www.inngest.com/)
- **Email Notifications**: [Resend](https://resend.com/) & React Email
- **File & Vault Storage**: AWS S3 / Cloudflare R2 / S3-compatible APIs (with local disk fallback)
- **Calendar Engine**: FullCalendar 6 / React
- **Data Visualization**: Recharts 3.x
- **Form Validation**: React Hook Form, Zod, and `@hookform/resolvers`

---

## 3. Installation

Clone the repository and install the project dependencies:

```bash
git clone https://github.com/Pruthviraj-patil20/-CareCircle.git
cd -CareCircle
npm install
```

---

## 4. Environment Setup

Copy the sample environment file and configure your local or cloud values:

```bash
cp .env.example .env.local
```

### Key Environment Variables

| Variable | Description | Default / Example |
| :--- | :--- | :--- |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/carecircle?schema=public` |
| `AUTH_SECRET` | NextAuth encryption secret (min 32 chars) | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Base application URL | `http://localhost:3000` |
| `GOOGLE_CLIENT_ID` | Optional Google OAuth Client ID | `your_client_id.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Optional Google OAuth Client Secret | `your_client_secret` |
| `RESEND_API_KEY` | Resend API key for transactional emails | `re_123456789` |
| `INNGEST_EVENT_KEY` | Inngest event dispatcher key | `local` (in dev) |
| `INNGEST_SIGNING_KEY` | Inngest signature verification key | `local` (in dev) |
| `S3_ACCESS_KEY_ID` | Object storage access key (S3 / R2) | Optional in dev (falls back to `.storage/`) |
| `S3_SECRET_ACCESS_KEY` | Object storage secret key | Optional in dev |
| `S3_BUCKET_NAME` | Storage bucket name | `carecircle-vault` |
| `S3_REGION` | Storage region | `us-east-1` (or `auto` for Cloudflare R2) |
| `S3_ENDPOINT` | Optional custom S3 endpoint URL | e.g. `https://<account_id>.r2.cloudflarestorage.com` |

---

## 5. Database Setup

Ensure you have a running PostgreSQL instance locally (or a cloud instance via Neon, Supabase, or Railway).

### Local Docker Option (Optional)

```bash
docker run --name carecircle-postgres \
  -e POSTGRES_USER=carecircle \
  -e POSTGRES_PASSWORD=carecircle_secret \
  -e POSTGRES_DB=carecircle \
  -p 5432:5432 -d postgres:16-alpine
```

Update your `DATABASE_URL` in `.env.local`:

```env
DATABASE_URL="postgresql://carecircle:carecircle_secret@localhost:5432/carecircle?schema=public"
```

---

## 6. Prisma Migration

Synchronize the Prisma schema with your database and generate the Prisma Client:

```bash
# Push schema directly in development or apply migrations:
npx prisma migrate dev --name init

# Generate Prisma Client types:
npx prisma generate
```

---

## 7. Seed Command

Populate the database with default administrative credentials and initial family circle data:

```bash
npx prisma db seed
```

### Default Seed Credentials

- **Email**: `test@carecircle.com`
- **Password**: `password123`
- **Initial Family**: `My Test Family` (Role: `OWNER`)

---

## 8. Development Command

Start the local development server with Turbopack / Webpack:

```bash
npm run dev
```

The application will be accessible at [http://localhost:3000](http://localhost:3000).

### Optional: Inngest Dev Server (for Background Jobs & Escalations)

To run and monitor background jobs (task escalations, document expiry alerts, and recurring reminders):

```bash
npx inngest-cli@latest dev
```

Open the Inngest Dev Dashboard at [http://localhost:8288](http://localhost:8288).

---

## 9. Testing & Code Quality

Run static analysis, type checking, and production verification:

```bash
# Type check without emitting files
npx tsc --noEmit

# Lint for syntax, accessibility, and code cleanliness
npm run lint

# Production compilation test
npm run build
```

---

## 10. Production Deployment

### Self-Hosted / Dockerized Production Run

1. Build the production Next.js bundle:
   ```bash
   npm run build
   ```
2. Start the optimized standalone server:
   ```bash
   npm run start
   ```
3. Ensure production environment variables are configured in your host environment:
   - `NODE_ENV="production"`
   - `DATABASE_URL` pointing to your managed PostgreSQL instance
   - `AUTH_SECRET` generated using a secure random generator
   - `NEXTAUTH_URL` set to your public domain (e.g. `https://carecircle.yourdomain.com`)
   - Configured S3 / Cloudflare R2 bucket credentials for document storage

---

## 11. Vercel Deployment

Deploying CareCircle to Vercel requires minimal setup:

1. **Import Repository**:
   - Push your code to GitHub / GitLab / Bitbucket.
   - Link the repository in the [Vercel Dashboard](https://vercel.com/new).

2. **Configure Environment Variables**:
   In the Vercel project settings, configure:
   - `DATABASE_URL`: Hosted PostgreSQL connection URL (e.g., Neon or Supabase with connection pooling).
   - `AUTH_SECRET`: Generate via `openssl rand -base64 32`.
   - `NEXTAUTH_URL`: Your production Vercel URL (e.g., `https://your-app.vercel.app`).
   - `RESEND_API_KEY`: Production Resend key with verified sending domain.
   - `INNGEST_EVENT_KEY` & `INNGEST_SIGNING_KEY`: From your [Inngest Cloud](https://www.inngest.com/) dashboard.
   - `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_BUCKET_NAME`, `S3_REGION`, `S3_ENDPOINT`: S3 or Cloudflare R2 credentials.

3. **Build & Development Settings**:
   - **Framework Preset**: Next.js
   - **Build Command**: `prisma generate && next build`
   - **Install Command**: `npm install`

4. **Deploy**:
   - Click **Deploy**. Vercel will build, optimize static assets, and deploy serverless functions across global edge regions.

---

## License

MIT License © CareCircle Team.
