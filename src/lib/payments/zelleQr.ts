/**
 * The Zelle QR code customers scan to pay by Zelle. One definition, used on the order confirmation page, the
 * subscription invoice page and every email that asks for a Zelle payment, so they can never show different codes.
 *
 * To change the QR code: upload the new image and change the address below.
 * The image is a 597 x 597 px WebP. (WebP shows in Gmail, Apple Mail, Yahoo and the browser-based Outlook; the
 * classic Outlook for Windows app cannot show WebP images, so every Zelle email also spells out the payment details
 * in text next to the image.)
 */
export const ZELLE_QR_URL = 'https://pub-0ab0207d475a48e7b7e92a35418eace6.r2.dev/email-assets/LR_Zelle.webp'

/** What the image is, for screen readers and for email clients that block images. */
export const ZELLE_QR_ALT = 'Zelle QR code - scan with your banking app to pay'

/** The image's own size in pixels (it is square). */
export const ZELLE_QR_PIXELS = 597
