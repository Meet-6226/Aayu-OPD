const rawVapiAssistant = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_VAPI_ASSISTANT_ID : null;
// Filter out old/deleted Vapi assistant ID (56be0ba5...) if set in Vercel environment variables
const activeVapiAssistant = (rawVapiAssistant && !rawVapiAssistant.includes('56be0ba5'))
  ? rawVapiAssistant
  : "01b266bc-4bcc-43dc-bcc9-842265a8fda2";

const rawVapiApiKey = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_VAPI_API_KEY : null;
const activeVapiApiKey = rawVapiApiKey || "5a143972-6dec-4c85-8f4c-5b7eb8947252";

export const DEMO_CONFIG = {
  // 1. Twilio config for WhatsApp reminders
  twilioSid: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_TWILIO_SID) || "AC195749a95d6dca1d1975ec04df69e72e", 
  twilioToken: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_TWILIO_TOKEN) || "19096538c3f7bfef79b8f7215e7cdd9a", 
  twilioWhatsappNumber: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_TWILIO_WHATSAPP_NUMBER) || "whatsapp:+14155238886", 
  twilioSandboxCode: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_TWILIO_SANDBOX_CODE) || "just-noise", 

  // 2. Vapi.ai config for automatic Hindi voice calls
  vapiApiKey: activeVapiApiKey, 
  vapiAssistantId: activeVapiAssistant,
  vapiPhoneNumberId: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_VAPI_PHONE_NUMBER_ID) || "eb51cb19-8560-4127-b3b4-d55b3388884f"
};
