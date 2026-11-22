# AyuTrace — Vercel Deployment Guide

AyuTrace runs seamlessly on **Vercel** serverless infrastructure backed by **Supabase PostgreSQL**.

---

## 1. Required Vercel Environment Variables

In your [Vercel Dashboard](https://vercel.com) → Your Project → **Settings** → **Environment Variables**, configure the following variables for **Production**, **Preview**, and **Development**:

| Variable | Recommended Value | Notes |
| :--- | :--- | :--- |
| `DATABASE_URL` | Copy from Supabase Dashboard → **Connect** → **Transaction pooler** (Port 6543) and append `?pgbouncer=true` (or `&pgbouncer=true`) | Supabase PgBouncer pooler connection string for serverless queries |
| `DIRECT_URL` | Copy from Supabase Dashboard → **Connect** → **Session** pooler or direct connection (Port 5432) | Direct PostgreSQL connection string for Prisma migrations and schema pushes |
| `GEMINI_API_KEY` | `Your Google Gemini API Key` | Google Gemini API key for packaging vision OCR |
| `GEMMA_MODEL` | `gemma-4-26b-a4b-it` | Target vision model variant |
| `SMTP_USER` | `your-email@gmail.com` or `apikey` | SMTP username for password reset OTP delivery |
| `SMTP_PASS` | `your-app-password` or API key | Gmail App Password (16 characters) or SMTP service token |
| `SMTP_HOST` | `smtp.gmail.com` | *(Optional, default: `smtp.gmail.com`)* SMTP mail server host |
| `SMTP_PORT` | `465` | *(Optional, default: `465`)* SMTP SSL port (or `587` for TLS) |
| `SMTP_SECURE` | `true` | *(Optional, default: `true`)* Set `true` for 465, `false` for 587 |
| `SMTP_FROM` | `"AyuTrace Security" <your-email@gmail.com>` | Sender header. Required when `SMTP_USER` is an API key (e.g. SendGrid); optional for email-based usernames |

> [!IMPORTANT]
> Copy both connection strings directly from your project's **Connect** dialog in the Supabase Dashboard rather than constructing them manually. The pooler cluster host index (`aws-0`, `aws-1`, etc.) is assigned uniquely per project and cannot be inferred from the cloud region alone. For `DATABASE_URL`, ensure `pgbouncer=true` is appended to the connection string to allow Prisma to work smoothly with Supabase's transaction pooler. Ensure both `DATABASE_URL` and `DIRECT_URL` are configured in Vercel before triggering a deployment.

---

## 2. Seeded Accounts for Testing

Once deployed, you can sign in immediately using the pre-seeded clinical staff credentials:

- **Lead Pharmacist:** `pharmacist@ayutrace.org` / `Password123!`
- **Clinical Admin:** `ananya@ayutrace.org` / `Password123!`

---

## 3. Redeploying on Vercel
After updating the environment variables:
1. Go to your **Deployments** tab on Vercel.
2. Click the three dots `...` next to the latest deployment.
3. Select **Redeploy** (with "Use existing Build Cache" unchecked).
