import { google } from 'googleapis';
import type { Order } from '@/payload-types';

export async function appendOrderToSheet(order: Order) {
  try {
    const clientEmail = process.env.GOOGLE_SHEETS_CLIENT_EMAIL;
    const privateKey = process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, '\n');
    const spreadsheetId = process.env.GOOGLE_SHEETS_ORDER_SPREADSHEET_ID;

    if (!clientEmail || !privateKey || !spreadsheetId) {
      console.warn('Google Sheets configuration missing. Skipping sheet update.');
      return;
    }

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: clientEmail,
        private_key: privateKey,
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    // Format Data
    const orderId = order.orderNumber || order.id || 'N/A';
    const date = new Date(order.createdAt).toLocaleString();
    
    // Customer Info
    const customerEmail = (typeof order.owner === 'object' && order.owner !== null ? order.owner.email : order.guestEmail) || 'N/A';
    const customerName = (typeof order.owner === 'object' && order.owner !== null ? `${order.owner.firstName || ''} ${order.owner.lastName || ''}`.trim() : '') || 'Guest';

    // Items
    const itemsList = (order.items || []).map((item: any) => {
      const productName = item.productSnapshot?.name || item.product?.name || 'Unknown Product';
      const variantText = item.variant && item.variant !== 'DEFAULT' ? ` [Variant: ${item.variant}]` : '';
      return `${productName}${variantText} (x${item.quantity || 1})`;
    }).join(', ');

    // Financials
    const subtotal = `$${(order.subtotal || 0).toFixed(2)}`;
    const discount = `$${(order.discountTotal || 0).toFixed(2)}`;
    const shipping = `$${(order.shippingTotal || 0).toFixed(2)}`;
    const tax = `$${(order.taxTotal || 0).toFixed(2)}`;
    const total = `$${(order.total || 0).toFixed(2)}`;

    const status = order.paymentStatus || order.status || 'N/A';

    const row = [
      orderId,
      date,
      customerName,
      customerEmail,
      itemsList,
      subtotal,
      discount,
      shipping,
      tax,
      total,
      status,
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'Sheet1!A:K',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [row],
      },
    });

    console.log(`Successfully appended order ${orderId} to Google Sheets.`);
  } catch (error) {
    console.error('Error appending order to Google Sheets:', error);
  }
}
