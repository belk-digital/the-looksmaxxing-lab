import { appendOrderToSheet } from './src/lib/google/sheets'
import 'dotenv/config'

async function testSheet() {
  console.log('Testing Google Sheets integration...')
  
  const dummyOrder: any = {
    id: 'test-123',
    orderNumber: 'TEST-123',
    createdAt: new Date().toISOString(),
    owner: {
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com'
    },
    items: [
      {
        productSnapshot: { name: 'Test Product' },
        quantity: 2
      }
    ],
    subtotal: 100,
    discountTotal: 10,
    shippingTotal: 5,
    taxTotal: 0,
    total: 95,
    paymentStatus: 'paid',
    status: 'completed'
  }
  
  try {
    await appendOrderToSheet(dummyOrder)
    console.log('Done.')
  } catch (err) {
    console.error('Error in test:', err)
  }
}

testSheet()
