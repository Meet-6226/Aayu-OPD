import { DEMO_CONFIG } from './demoConfig';

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

const validateAndFormatPhone = (phoneStr) => {
  if (!phoneStr) return '+919876543210';
  let cleaned = String(phoneStr).trim().replace(/[\s-()]/g, '');
  if (cleaned.startsWith('whatsapp:')) {
    cleaned = cleaned.replace('whatsapp:', '');
  }
  let digits = cleaned.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) {
    return '+' + digits;
  } else if (digits.length === 11 && digits.startsWith('0')) {
    digits = digits.slice(1);
  }
  if (digits.length === 10) {
    return '+91' + digits;
  }
  if (digits.length > 10 && digits.length <= 15) {
    return '+' + digits;
  }
  return '+919876543210';
};

// Helper to send Twilio WhatsApp message directly from the browser
export const sendWhatsAppDirect = async (phone, body) => {
  const formatted = validateAndFormatPhone(phone);

  const { twilioSid, twilioToken, twilioWhatsappNumber } = DEMO_CONFIG;
  if (!twilioSid || !twilioToken) {
    console.log(`[sendWhatsAppDirect] Twilio credentials missing in demoConfig.js. Message: "${body}" to ${formatted}`);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('whatsapp_dispatched', { detail: { phone: formatted, body, status: 'simulated', note: 'Twilio credentials missing' } }));
    }
    return false;
  }

  console.log(`[sendWhatsAppDirect] Sending WhatsApp to ${formatted}...`);
  try {
    const authHeader = 'Basic ' + btoa(`${twilioSid}:${twilioToken}`);
    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        From: twilioWhatsappNumber,
        To: `whatsapp:${formatted}`,
        Body: body
      })
    });

    const data = await response.json();
    if (response.ok) {
      console.log(`[sendWhatsAppDirect] Success! Msg SID: ${data.sid}`);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('whatsapp_dispatched', { detail: { phone: formatted, body, status: 'sent', sid: data.sid } }));
      }
      return true;
    } else {
      console.warn(`[sendWhatsAppDirect] Twilio response warning (code ${data.code}): ${data.message}`);
      if (data.code === 63038) {
        console.warn(`[Twilio Quota] Daily 50 message limit reached on free Twilio sandbox account today.`);
      }
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('whatsapp_dispatched', { detail: { phone: formatted, body, status: 'limit_exceeded', error: data.message } }));
      }
      return false;
    }
  } catch (err) {
    console.error(`[sendWhatsAppDirect] Network failure:`, err.message);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('whatsapp_dispatched', { detail: { phone: formatted, body, status: 'error', error: err.message } }));
    }
    return false;
  }
};

// Helper to initiate Vapi.ai voice call directly from the browser
const makeVoiceCallDirect = async (phone, callType, apptData = {}) => {
  const formatted = validateAndFormatPhone(phone);
  if (!formatted) {
    console.log(`[makeVoiceCallDirect] Invalid phone number, skipping WhatsApp/call: ${phone}`);
    return false;
  }

  const { vapiApiKey, vapiAssistantId, vapiPhoneNumberId } = DEMO_CONFIG;
  if (!vapiApiKey || !vapiAssistantId) {
    console.log(`[makeVoiceCallDirect] Vapi credentials missing in demoConfig.js. Voice Call Type: "${callType}" to ${formatted}`);
    return false;
  }

  console.log(`[makeVoiceCallDirect] Initiating voice call to ${formatted}`);
  try {
    const response = await fetch('https://api.vapi.ai/call', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${vapiApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        phoneNumberId: vapiPhoneNumberId || null,
        assistantId: vapiAssistantId,
        customer: {
          number: formatted
        },
        assistantOverrides: {
          variableValues: {
            patientName: apptData.patientName || 'Patient',
            doctorName: apptData.doctorName || 'Doctor',
            appointmentDate: apptData.appointmentDate || '',
            appointmentTime: apptData.appointmentTime || '',
            callType: callType
          }
        }
      })
    });

    const data = await response.json();
    if (response.ok) {
      console.log(`[makeVoiceCallDirect] Vapi success! Call ID: ${data.id}`);
      return true;
    } else {
      console.error(`[makeVoiceCallDirect] Vapi error:`, data);
      return false;
    }
  } catch (err) {
    console.error(`[makeVoiceCallDirect] Network failure:`, err.message);
    return false;
  }
};

// TRIGGERS
export const triggerPatientRegistrationDemo = async (patientData) => {
  const { name, phone } = patientData;
  console.log(`[triggerPatientRegistrationDemo] New patient registered. ID: ${patientData.uid}, Name: ${name}`);

  // 1. Send Welcome WhatsApp immediately
  const welcomeMsg = `Namaste ${name}! Welcome to Aayu OPD Intelligence. You're now registered. Book your first appointment anytime.`;
  sendWhatsAppDirect(phone, welcomeMsg);

  // 2. Wait exactly 8 seconds
  await delay(8000);

  // 3. Trigger Hindi welcome voice call
  makeVoiceCallDirect(phone, 'welcome', { patientName: name });
};

export const triggerAppointmentBookingDemo = async (appointmentData, patientData = {}) => {
  const { doctorName, appointmentDate, appointmentTime, bookingId } = appointmentData;
  const rawPhone = patientData?.phone || patientData?.phoneNumber || patientData?.familyContactPhone || appointmentData?.patientPhone || (appointmentData?.patientId && /^\+?\d{10,12}$/.test(appointmentData.patientId) ? appointmentData.patientId : '+919876543210');
  const name = patientData?.name || appointmentData?.patientName || 'Patient';

  console.log(`[triggerAppointmentBookingDemo] New booking written. ID: ${appointmentData.id || bookingId}, Phone: ${rawPhone}`);

  // 1. Send Booking Confirmation WhatsApp immediately
  const confirmationMsg = `Aayu Clinic: Hi ${name}! Your appointment is confirmed. Doctor: ${doctorName}. Date: ${appointmentDate}. Time: ${appointmentTime}. Booking ID: ${bookingId}. Reply 1 to confirm.`;
  sendWhatsAppDirect(rawPhone, confirmationMsg);

  // 2. Wait exactly 3 seconds
  await delay(3000);

  // 3. Trigger voice call confirmation
  makeVoiceCallDirect(rawPhone, 'confirmation', {
    patientName: name,
    doctorName,
    appointmentDate,
    appointmentTime
  });
};
