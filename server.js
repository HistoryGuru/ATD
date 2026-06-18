require('dotenv').config();
const express = require('express');
const fs = require('fs');
const path = require('path');
const Stripe = require('stripe');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

const app = express();
const PORT = process.env.PORT || 4000;

// ---------------------------------------------------------------------------
// Map each Stripe Price ID to the plan it unlocks, and which Cal.com event
// type (calLink) the customer should be able to book once they've paid.
// Find the Price ID in Stripe Dashboard: Product catalog -> [product] -> the
// price's ID starts with "price_". The calLink is your Cal.com username/team
// slug + the event type's slug, exactly as it appears in that event type's
// booking URL (e.g. cal.com/atd-soccer/private-training -> "atd-soccer/private-training").
// ---------------------------------------------------------------------------
const PRICE_TO_PLAN = {
  'price_1TjVxtPaFgBUJNuNqOC8CB9d': {
    plan: '1:1 Training',
    calLink: 'leroy-qu-h4xph3/1-1-core-session'
  },
  'price_1TjW3MPaFgBUJNuN4Z1oqU2O': {
    plan: 'One Week Intensive',
    calLink: 'leroy-qu-h4xph3/one-week-core-intensive'
  },
  'price_1TjW7LPaFgBUJNuNC7Mt8Ovp': {
    plan: 'Group Session',
    calLink: 'leroy-qu-h4xph3/group-session-60-min'
  }
};

// ---------------------------------------------------------------------------
// Simple persistent record of "which Checkout Sessions paid, and for what
// plan." A JSON file is fine to get started; move to a real database
// (Postgres, SQLite, etc.) once this needs to survive redeploys/scaling
// cleanly or you want to query purchase history.
// ---------------------------------------------------------------------------
const DB_PATH = path.join(__dirname, 'data', 'access-store.json');

function loadStore() {
  try {
    return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
  } catch {
    return {};
  }
}

function saveStore(store) {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  fs.writeFileSync(DB_PATH, JSON.stringify(store, null, 2));
}

// ---------------------------------------------------------------------------
// Stripe needs the RAW request body to verify the webhook signature, so this
// route is registered with express.raw() and must come BEFORE express.json().
// ---------------------------------------------------------------------------
app.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, req.headers['stripe-signature'], WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;

    try {
      // Re-fetch with line items expanded so we know exactly which price was bought.
      const fullSession = await stripe.checkout.sessions.retrieve(session.id, {
        expand: ['line_items']
      });

      const priceId = fullSession.line_items?.data?.[0]?.price?.id;
      const match = PRICE_TO_PLAN[priceId];

      if (match && fullSession.payment_status === 'paid') {
        const store = loadStore();
        store[session.id] = {
          plan: match.plan,
          calLink: match.calLink,
          customerEmail: fullSession.customer_details?.email || null,
          paidAt: new Date().toISOString()
        };
        saveStore(store);
        console.log(`Unlocked "${match.plan}" booking for session ${session.id}`);
      } else {
        console.warn(`Paid session with unrecognized price ID: ${priceId}`);
      }
    } catch (err) {
      console.error('Error processing checkout.session.completed:', err);
    }
  }

  res.json({ received: true });
});

// JSON body parsing for every other route, added AFTER the webhook route.
app.use(express.json());

// ---------------------------------------------------------------------------
// booking.html calls this after Stripe redirects the customer back, to find
// out whether their payment unlocked a booking link, and which one.
// ---------------------------------------------------------------------------
app.get('/api/booking-access', (req, res) => {
  const { session_id } = req.query;
  if (!session_id) {
    return res.status(400).json({ ok: false, error: 'Missing session_id' });
  }

  const store = loadStore();
  const record = store[session_id];

  if (!record) {
    return res.status(404).json({ ok: false, error: 'No completed payment found for this session yet.' });
  }

  res.json({ ok: true, plan: record.plan, calLink: record.calLink });
});

app.use(express.static(path.join(__dirname, 'public')));

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
