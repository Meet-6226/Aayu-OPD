import { DEMO_CONFIG } from './demoConfig';

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

const validateAndFormatPhone = (phoneStr) => {
  if (!phoneStr) return null;
  let cleaned = phoneStr.trim().replace(/[\s-()]/g, '');
  if (cleaned.startsWith('whatsapp:')) {
    cleaned = cleaned.replace('whatsapp:', '');
  }
  if (cleaned.startsWith('+91')) {
    if (cleaned.length === 13 && /^\+91\d{10}$/.test(cleaned)) {
      return cleaned;
    }
  } else if (cleaned.length === 10 && /^\d{10}$/.test(cleaned)) {
    return '+91' + cleaned;
  }
  return null;
};

// Helper to send Twilio WhatsApp message directly from the browser
export const sendWhatsAppDirect = async (phone, body) => {
  const formatted = validateAndFormatPhone(phone);
  if (!formatted) {
    console.log(`[sendWhatsAppDirect] Invalid phone number, skipping WhatsApp: ${phone}`);
    return false;
  }

  const { twilioSid, twilioToken, twilioWhatsappNumber } = DEMO_CONFIG;
  if (!twilioSid || !twilioToken) {
    console.log(`[sendWhatsAppDirect] Twilio credentials missing in demoConfig.js. Message: "${body}" to ${formatted}`);
    return false;
  }

  console.log(`[sendWhatsAppDirect] Sending WhatsApp to ${formatted}`);
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
      return true;
    } else {
      console.error(`[sendWhatsAppDirect] Twilio error:`, data.message);
      return false;
    }
  } catch (err) {
    console.error(`[sendWhatsAppDirect] Network failure:`, err.message);
    return false;
  }
};

// Helper to initiate Vapi.ai voice call directly from the browser
export const makeVoiceCallDirect = async (phone, callType, apptData = {}) => {
  const formatted = validateAndFormatPhone(phone);
  if (!formatted) {
    console.log(`[makeVoiceCallDirect] Invalid phone number, skipping call: ${phone}`);
    return false;
  }

  const { vapiApiKey, vapiAssistantId } = DEMO_CONFIG;
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
