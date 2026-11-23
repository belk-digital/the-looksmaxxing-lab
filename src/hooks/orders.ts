import type { CollectionAfterChangeHook } from 'payload'
import { appendOrderToSheet } from '@/lib/google/sheets'

export const afterOrderChange: CollectionAfterChangeHook = async ({ doc, previousDoc, operation, req }) => {
  // Sync to Google Sheets if it became paid, captured, or completed
  const becamePaid = (doc.paymentStatus === 'paid' || doc.paymentStatus === 'captured') && 
                     (previousDoc?.paymentStatus !== 'paid' && previousDoc?.paymentStatus !== 'captured')
  const becameCompleted = doc.status === 'completed' && previousDoc?.status !== 'completed'

  if (becamePaid || becameCompleted) {
    try {
      await appendOrderToSheet(doc as any)
      req.payload.logger.info(`Synced Order ${doc.id} to Google Sheets from hook`)
    } catch (err) {
      req.payload.logger.error({ err }, `Failed to sync Order ${doc.id} to Google Sheets`)
    }
  }

  // A paid order goes to ShipStation (see src/lib/shipstation). Triggered here, when the payment becomes "captured", and
  // not from finalizeOrder: in this app finalizeOrder also runs for UNPAID orders (to reserve stock), and an admin marking a
  // manual order paid later never runs it again. Also runs when the admin ticks "Send to ShipStation again". Not awaited:
  // reading or writing this order from inside its own save would wait on the row this transaction still holds, so the
  // hand-off waits for the save to commit by itself. The 30-minute cron is the fallback if the function is cut short.
  if ((becamePaid || req.context.retryShipStation) && doc.paymentStatus === 'captured') {
    import('@/lib/shipstation/sync')
      .then(({ pushOrderToShipStation }) => pushOrderToShipStation(req.payload, doc.id))
      .catch((err) => req.payload.logger.error({ err }, `ShipStation hand-off failed for order ${doc.id}`))
  }

  if (operation === 'update') {
    // If the order is refunded or cancelled, we must reverse any associated affiliate conversions
    const wasRefunded = doc.status === 'refunded' && previousDoc?.status !== 'refunded'
    const wasCancelled = doc.status === 'cancelled' && previousDoc?.status !== 'cancelled'

    // Pull a refunded/cancelled order back out of the ShipStation shipping queue (or, if a label was already
    // bought, tell support). Never throws; the order write joins this transaction through `req`.
    if ((wasRefunded || wasCancelled) && doc.shipstationOrderId && doc.shipstationSyncStatus === 'synced') {
      try {
        const { cancelInShipStation } = await import('@/lib/shipstation/sync')
        await cancelInShipStation(req.payload, doc, { req })
      } catch (err) {
        req.payload.logger.error({ err }, `Failed to cancel ShipStation order for order ${doc.id}`)
      }
    }

    if (wasRefunded || wasCancelled) {
      const conversions = await req.payload.find({
        collection: 'affiliate-conversions',
        where: { order: { equals: doc.id } },
        overrideAccess: true,
      })

      for (const conv of conversions.docs) {
        if (conv.status !== 'voided' && conv.status !== 'reversed') {
          await req.payload.update({
            collection: 'affiliate-conversions',
            id: conv.id,
            data: {
              status: 'reversed',
              reversedAt: new Date().toISOString(),
              reversedReason: wasRefunded ? 'order_refunded' : 'order_cancelled',
            },
            overrideAccess: true,
          })
        }
      }
    }
  }

  // Subscription bookkeeping: a paid month advances the subscription; a cancelled invoice is cleared from it.
  // Uses `req` so it runs inside the same database transaction as the order save.
  const subscriptionId = doc.subscription && typeof doc.subscription === 'object' ? doc.subscription.id : doc.subscription
  if (subscriptionId && doc.orderType && doc.orderType !== 'one_time') {
    const becameCaptured = doc.paymentStatus === 'captured' && previousDoc?.paymentStatus !== 'captured'
    const becameCancelled = doc.status === 'cancelled' && previousDoc?.status !== 'cancelled'
    if (becameCaptured || becameCancelled) {
      try {
        const service = await import('@/lib/subscriptions/service')
        if (becameCaptured) await service.onSubscriptionOrderPaid(req.payload, doc, req)
        else await service.onSubscriptionOrderCancelled(req.payload, doc, req)
      } catch (err) {
        req.payload.logger.error({ err }, `Subscription update failed for order ${doc.id}`)
      }
    }
  }

  // Handle custom email notes from admin
  if (req.context.queuedCustomerNotes && Array.isArray(req.context.queuedCustomerNotes)) {
    const customerEmail = doc.owner?.email || doc.guestEmail
    
    if (customerEmail) {
      try {
        const { generateOrderInvoiceHtml } = await import('@/lib/emails/generateOrderEmail')
        
        for (const customNote of req.context.queuedCustomerNotes) {
          // Pass the note into the email generator
          const invoiceHtml = await generateOrderInvoiceHtml(doc, req.payload, customNote)
          
          await req.payload.sendEmail({
            to: customerEmail,
            subject: `Update regarding your Order #${doc.orderNumber || doc.id}`,
            html: invoiceHtml,
          })
          
          req.payload.logger.info(`Sent custom order note to ${customerEmail} for order ${doc.id}`)
        }
      } catch (err) {
        req.payload.logger.error({ err }, `Failed to send custom order note email for order ${doc.id}`)
      }
    }
  }

  return doc
}
