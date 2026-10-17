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

The owner signs in at `/admin` with an email in `FARMOSE_OWNER_EMAILS`. For the
first sign-in, choose **Create account** and verify the email address. No
password is embedded in the code or issued by the server. The owner can add an
approved staff email under **Team**, choose a preset role or custom permissions,
and deactivate or remove access immediately. Staff create their own password
and verify their email. Server routes enforce each permission; hiding a tab in
the browser is not the access control.

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
