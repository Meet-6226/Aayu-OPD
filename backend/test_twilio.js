const twilio = require('twilio');

const twilioSid = "ACa671ca7b66e22827bfecaa4c8cbccdf1";
const twilioToken = "6168010c522df58b2e4656d32e050b22";
const twilioWhatsappNumber = "whatsapp:+14155238886";

const client = twilio(twilioSid, twilioToken);

async function test() {
  console.log('Sending test WhatsApp message...');
  try {
    const message = await client.messages.create({
      from: twilioWhatsappNumber,
      to: 'whatsapp:+919975027178', // sahil's number from KIs/code
      body: 'Apollo Hospital: Twilio backend test message. If you receive this, credentials are valid!'
    });
    console.log('✅ Success! Message SID:', message.sid);
    console.log('Status:', message.status);
  } catch (err) {
    console.error('❌ Twilio Error Details:');
    console.error('Code:', err.code);
    console.error('Message:', err.message);
    console.error('Status:', err.status);
  }
}

test();
