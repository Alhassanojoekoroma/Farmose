# Farmose

Farmose is a Next.js storefront and staff workspace hosted on Vercel. Its live
catalog, appearance settings, scheduled news, staff permissions, and historical
orders are stored in Neon Postgres. Images and videos are stored in Neon Object
Storage. The public purchase path remains a WhatsApp enquiry; `/api/orders`
returns HTTP 410 and cannot create orders.

## Development

Use Node.js 22.13 or later. Copy `.env.example` to `.env.local`, fill the
server-only values, then run:

```sh
npm install
npm run dev
npm test
npm run build
```

`DATABASE_URL` is the pooled Neon connection string. `NEON_AUTH_BASE_URL` is
the Neon Auth endpoint for the **same** branch. Generate a fresh random value
of at least 32 bytes for `NEON_AUTH_COOKIE_SECRET`. The AWS fields are scoped
Neon Object Storage credentials for the `farmose-media` bucket. Keep all of
these out of the repository and client code.

## Administration

The initial owner signs in at `/admin` with an email in `FARMOSE_OWNER_EMAILS`.
For a new account, choose **Create account**, choose a password, and verify the
email address. No password is embedded in the code or issued by the server.

For a business handover, an owner adds the recipient's email under **Team** and
selects **Business owner — full control**. The recipient opens `/admin`, creates
their own login, and verifies their email. Their approved owner role is stored
in `admin_users`; it does not require adding their address to deployment
configuration. They can then approve another business owner or assign staff
preset roles or custom permissions. Owners have full access including team
management. Staff cannot grant access or promote themselves.

An owner can deactivate or remove another approved account immediately, even
if that account has an existing session. Changing one's own access requires
another owner, and initial owners configured in `FARMOSE_OWNER_EMAILS` remain
protected by server configuration. Server routes enforce every permission;
hiding a tab in the browser is not the access control.

The `/admin/login` page stays public. Next.js `proxy.ts` refreshes session
cookies before rendering `/admin`; role checks remain in the server-side
administration code and API routes.

| Permission | Scope |
| --- | --- |
| Products | Edit the catalog and product visibility |
| Content | Edit site appearance and business details |
| Media | Upload and list media |
| Orders | See historical orders and update their status |
| News & offers | Publish or schedule promotions, news, visits, and programs; upload post images |
| Team | Owner only: approve staff and edit permissions |

Posts have a start time, optional end time, and published switch. The public
`/updates` page and home link show published posts only during their chosen
window. The server evaluates dates on each request; the public page cannot
expose drafts or future posts. Times entered in the admin form are converted
from the editor's local time to UTC for storage. Public dates are displayed in
Freetown time.

## Data migration

The schema is versioned in `scripts/migrations/001_vercel.sql`. For a one-time
move from the former Sites D1 database, export the four tables into an ignored
`work/d1-export.json` file with arrays named `catalog_products`,
`site_settings`, `orders`, and `admin_users`. `scripts/import-d1.mjs` applies
the migration, copies referenced `/api/media` assets from the old public site
to `farmose-media`, and imports product, setting, and historical order rows.
It is idempotent on existing primary keys and never imports old Sites identity
records as Vercel login credentials. Feed connection and storage credentials
as JSON on stdin; never commit the export or credentials.

## Deployment

The existing Vercel project uses `npm run build` (`next build`). Set all eight
server-only environment variables from `.env.example` for Production, deploy
the GitHub `main` branch, and test the Vercel URL before changing `farmose.com`.
Allow the Vercel and custom domains in Neon Auth's trusted domains. Preview
deployments need their own Neon branch, Auth endpoint, media credentials, and
owner allowlist before testing write actions. The former Sites configuration
is retained only as a rollback source while the hosting change is verified.
