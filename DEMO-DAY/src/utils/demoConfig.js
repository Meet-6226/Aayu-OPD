// Demo Credentials configuration for Backend-less direct client alerts (exposing keys in client is acceptable for local/demo day)
export const DEMO_CONFIG = {
  // 1. Twilio config for WhatsApp reminders
  // Enter your Twilio Account SID and Auth Token here
  twilioSid: "ACa671ca7b66e22827bfecaa4c8cbccdf1", 
  twilioToken: "6168010c522df58b2e4656d32e050b22", 
  twilioWhatsappNumber: "whatsapp:+14155238886", // Twilio Sandbox WhatsApp number (or your custom sender)

  // 2. Vapi.ai config for automatic Hindi voice calls
  // Enter your Vapi API Private Key and Assistant ID
  vapiApiKey: "5a143972-6dec-4c85-8f4c-5b7eb8947252", 
  vapiAssistantId: "56be0ba5-dd51-44cc-98f9-02bd7291659e" 
};
