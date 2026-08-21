# Better Wealth Investment Group

Initial Next.js application foundation for the Better Wealth Investment Group client portal.

## Local development

```bash
npm install
npm run dev
```

Authentication, database access, KYC document storage, and manual wallet-operation workflows use customer-owned services.

## Transactional email (Resend)

The app includes automatic branded emails for account creation, deposit and withdrawal submissions, identity-verification submission, and approved deposit, withdrawal, and KYC decisions.

Add these private environment variables in Vercel (Production, Preview, and Development):

```text
SUPABASE_SERVICE_ROLE_KEY=...
RESEND_API_KEY=re_...
EMAIL_FROM=Better Wealth Investment Group <updates@your-verified-domain.com>
NEXT_PUBLIC_SITE_URL=https://www.bwiginvest.com
```

`SUPABASE_SERVICE_ROLE_KEY` is available in Supabase **Settings → API Keys**. Never expose it in a `NEXT_PUBLIC_` variable. In Resend, first verify the sending domain used in `EMAIL_FROM`, then create an API key with sending permission. Supabase continues to send its own email-verification message; the Better Wealth registration email is an additional account-created confirmation.
