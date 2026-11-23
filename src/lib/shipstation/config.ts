// Per-site settings for the ShipStation integration. Everything that differs between the sibling sites that share one
// ShipStation account lives here; the rest of src/lib/shipstation is identical across sites.
export const SHIPSTATION_CONFIG = {
  brandName: "Longevia Research",
  // Unique per site: ShipStation holds orders from several sites, and an order is matched back to its site by this
  // prefix in the order key ("lgv-<order id>"). Never reuse another site's prefix.
  orderKeyPrefix: "lgv",
  // Shown on every order in ShipStation (Custom Field 1) so staff can tell the sites apart at a glance.
  sourceLabel: "Longevia Research website",
  staffEmail: "support@longeviaresearch.com",
  fromAddress: "",
  adminPath: "/admin",
  siteUrl: process.env.NEXT_PUBLIC_SERVER_URL || "https://longeviaresearch.com",
  // When ShipStation reports a label, also queue the site's own "your order has shipped" email (needs the site's
  // sendTrackingEmail order hook). Off for sites that do not have that email.
  emailCustomerOnShipment: false,
  // Package weight ESTIMATE in ounces (drives ShipStation rate shopping and automation rules; staff weigh the real parcel).
  weights: { packagingOz: 3, vialOz: 1, kitOz: 6, minPackageOz: 4 },
  paymentLabels: {
    stripe: "Card (Stripe)",
    stripe_link: "Card (Manual Link)",
    apple_pay: "Apple Pay (Manual)",
    zelle: "Zelle",
    authnet_bridge: "Card (Longevia Beauty)",
  } as Record<string, string>,
}
