import { http, HttpResponse } from 'msw';

export const apiHandlers = [
  // Twilio: create SMS
  http.post('https://api.twilio.com/2010-04-01/Accounts/:accountSid/Messages.json', () =>
    HttpResponse.json({ sid: 'SM_test_sid', status: 'queued', to: '+910000000000' }),
  ),

  // Razorpay: create order
  http.post('https://api.razorpay.com/v1/orders', async ({ request }) => {
    const body = (await request.json()) as { amount: number; currency?: string; receipt: string };
    return HttpResponse.json({
      id: 'order_test_razorpay_123',
      entity: 'order',
      amount: body.amount,
      amount_paid: 0,
      amount_due: body.amount,
      currency: body.currency ?? 'INR',
      receipt: body.receipt,
      status: 'created',
      created_at: Math.floor(Date.now() / 1000),
    });
  }),
];
