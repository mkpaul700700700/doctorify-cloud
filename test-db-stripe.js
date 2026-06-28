require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

async function main() {
  console.log("Checking database connection...");
  try {
    const patient = await prisma.user.findFirst({ where: { role: 'PATIENT' } });
    const doctor = await prisma.user.findFirst({ 
      where: { role: 'DOCTOR' },
      include: { doctorProfile: true } 
    });

    if (!patient || !doctor) {
      console.log("Missing patient or doctor in DB.");
      return;
    }

    console.log(`Found Patient: ${patient.email}`);
    console.log(`Found Doctor: ${doctor.email}, Fee: ${doctor.doctorProfile?.consultationFee}`);

    // Try a simulated transaction
    const date = new Date();
    date.setDate(date.getDate() + 1); // tomorrow

    console.log("Testing Prisma Transaction...");
    const url = await prisma.$transaction(async (tx) => {
      return "Transaction Successful";
    }, {
      isolationLevel: 'Serializable',
      maxWait: 5000,
      timeout: 10000
    });
    
    console.log("Transaction Result:", url);

    console.log("Testing Stripe Connection...");
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: { currency: 'usd', product_data: { name: 'Test' }, unit_amount: 1500 },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: 'http://localhost:3000/success',
      cancel_url: 'http://localhost:3000/cancel',
    });
    console.log("Stripe Session Created:", session.id);

    console.log("ALL SYSTEMS GO.");
  } catch (err) {
    console.error("Database or Stripe Error:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
