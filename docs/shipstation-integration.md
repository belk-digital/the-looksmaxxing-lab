# ShipStation integration (Longevia Research)

Paid orders are pushed to ShipStation (one shared account with other sites), into **this site's own store**. Staff buy the
label in ShipStation; ShipStation tells the site, which marks the order shipped and stores carrier, tracking number and
the tracking link (shown on the customer's account page). International orders are never pushed; they are held for manual
shipping. Code: `src/lib/shipstation/`. Per-site settings (brand, order-key prefix `lgv`, support email, package weights,
shipped-email switch) are in `src/lib/shipstation/config.ts`. Ported from the 99 Purity Peptides implementation, where it
has run on real orders.

## Flow

1. **Checkout and subscription invoices** stamp every new order `shipstationSyncStatus = pending`.
2. **Paid** is detected in `afterOrderChange` (`src/hooks/orders.ts`) the moment the payment becomes `captured`: card
   webhook, an admin marking a manual order paid, a free order at creation, or a subscription renewal being paid. It is
   triggered there and NOT from `finalizeOrder`, because in this app `finalizeOrder` also runs for UNPAID orders (to reserve
   stock) and an admin marking a manual order paid later never runs it again. The push is idempotent (`orderKey = lgv-<id>`).
3. **Label bought in ShipStation** fires `SHIP_NOTIFY` to `/api/webhooks/shipstation?token=...` (token derived from
   `SHIPSTATION_API_SECRET`). Only orders whose key starts with `lgv-` are touched; other sites' orders are ignored.
4. **Cron** `/api/cron/shipstation-sync` (every 30 min) retries failed pushes and records shipments the webhook missed.
5. **Refund / cancel before shipping** cancels the ShipStation order (or emails support if a label already exists).

## Customer shipped email: OFF by default

This site has no "your order has shipped" email today (staff only paste a tracking link), so ShipStation does not send
one either: the customer's email is never sent to ShipStation, and `emailCustomerOnShipment` in the config is `false`.
Customers see the tracking link on their account order page. If you want an automatic shipped email, say so: it needs a
`sendTrackingEmail` hook like the sibling sites, then set `emailCustomerOnShipment: true`.

## Order sidebar

The ShipStation fields (status, id, error, attempts, carrier, tracking number, ship date) and **Finalized** are
system-written and read-only on purpose: the admin form re-submits every field it loaded, so a stale page would
otherwise overwrite them. To retry an order (e.g. after fixing an address), tick **Send to ShipStation again** and Save.

Statuses: empty = order from before the integration (never sent); Waiting to send; Sent to ShipStation; Failed (will
retry, up to 6 times, then support is emailed); Ship manually (international / bad address: ship by hand, support is
emailed); Not sent (refunded, or already shipped by hand); Cancelled in ShipStation.

## Setup / deploy checklist

1. In ShipStation create this site's store (Selling Channels > Store Setup) and note its id (`GET /stores`).
2. Vercel (Production only): `SHIPSTATION_API_KEY`, `SHIPSTATION_API_SECRET` (same V1 pair as the other sites),
   `SHIPSTATION_STORE_ID` (this site's store id), and `CRON_SECRET` (the cron refuses to run without it).
3. Apply migration `20261123_120000_add_order_shipstation_fields` to the database BEFORE deploying the code
   (`payload migrate`; if the migrations table has a leftover `dev` row it asks "data loss will occur, proceed?",
   answer yes for this additive migration, e.g. `printf 'y\n' | npx cross-env NODE_OPTIONS=--no-deprecation payload migrate`).
4. Deploy, then register the webhook for this site's store:
   `pnpm shipstation-webhook --base-url https://longeviaresearch.com --store-id <store id>` (dry run), then add `--apply`.
   The script only ever touches webhooks that belong to this site's address.
5. Verify with one real paid order, then void the label for the postage.

## Package weight

Catalogue weights are not used; weight is estimated from `config.ts` (`packagingOz`, `vialOz`, `kitOz`, `minPackageOz`).
It only drives ShipStation rate shopping and automation rules; staff weigh the real parcel. Tune the numbers to this
site's products.

## Tests

- `tests/int/shipstation.int.spec.ts` and `tests/int/shipstation.hooks.int.spec.ts`: no network, no database (always safe).
- `SS_LIVE_TEST=yes-write-to-live-shipstation npx vitest run tests/int/shipstation.live.int.spec.ts`: this code against
  the real ShipStation account (needs the three SHIPSTATION_ variables in `.env.local`). It creates and deletes
  clearly-labelled `ZZ-TEST-SS` orders; it does not touch the database.
