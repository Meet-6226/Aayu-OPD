const rawVapiAssistant = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_VAPI_ASSISTANT_ID : null;
const activeVapiAssistant = (rawVapiAssistant && !rawVapiAssistant.includes('56be0ba5'))
  ? rawVapiAssistant
  : "01b266bc-4bcc-43dc-bcc9-842265a8fda2";

const rawVapiApiKey = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_VAPI_API_KEY : null;
const activeVapiApiKey = rawVapiApiKey || "5a143972-6dec-4c85-8f4c-5b7eb8947252";

export const DEMO_CONFIG = {
  twilioSid: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_TWILIO_SID) || "ACa671ca7b66e22827bfecaa4c8cbccdf1", 
  twilioToken: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_TWILIO_TOKEN) || "6168010c522df58b2e4656d32e050b22", 
  twilioWhatsappNumber: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_TWILIO_WHATSAPP_NUMBER) || "whatsapp:+14155238886", 

  vapiApiKey: activeVapiApiKey, 
  vapiAssistantId: activeVapiAssistant,
  vapiPhoneNumberId: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_VAPI_PHONE_NUMBER_ID) || "eb51cb19-8560-4127-b3b4-d55b3388884f"
};
