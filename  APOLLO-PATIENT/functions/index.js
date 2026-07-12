const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

const COLLECTIONS = {
  PATIENTS: 'patients',
  DOCTORS: 'doctors',
  APPOINTMENTS: 'appointments',
  DOCTOR_SLOTS: 'doctor_slots',
  WAITLIST: 'waitlist',
  REMINDERS: 'reminders',
  NOTIFICATIONS: 'notifications'
};

// Helper for execution delays
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// Helper for phone validation: must start with +91 followed by exactly 10 digits
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

// ==========================================
// CORE REUSABLE LOGIC HELPERS (DRY Principle)
// ==========================================

const sendWhatsAppReminderLogic = async (appointmentId, reminderType) => {
  const db = admin.firestore();
  
  // 1. Fetch appointment details
  const apptSnap = await db.collection(COLLECTIONS.APPOINTMENTS).doc(appointmentId).get();
  if (!apptSnap.exists) {
    console.error(`[sendWhatsAppReminderLogic] Appointment not found: ${appointmentId}`);
    return false;
  }
  const apptData = apptSnap.data();

  // 2. Fetch patient details
  const patientSnap = await db.collection(COLLECTIONS.PATIENTS).doc(apptData.patientId).get();
  if (!patientSnap.exists) {
    console.error(`[sendWhatsAppReminderLogic] Patient not found: ${apptData.patientId}`);
    return false;
  }
  const patientData = patientSnap.data();

  const recipientPhone = reminderType === 'family_notification' 
    ? patientData.familyContactPhone 
    : patientData.phone;

  const formattedPhone = validateAndFormatPhone(recipientPhone);
  if (!formattedPhone) {
    console.log(`[sendWhatsAppReminderLogic] Invalid phone number, skipping WhatsApp/call: ${recipientPhone}`);
    return false;
  }

  // 3. Fetch doctor details
  const docSnap = await db.collection(COLLECTIONS.DOCTORS).doc(apptData.doctorId).get();
  const docData = docSnap.exists ? docSnap.data() : {};

  // Construct message parameters
  const persona = apptData.persona || patientData.persona || 'default';
  const patientName = patientData.name || 'Patient';
  const doctorName = apptData.doctorName || docData.name || 'Doctor';
  const dateStr = apptData.appointmentDate || '';
  const timeStr = apptData.appointmentTime || '';
  const bookingId = apptData.bookingId || apptData.id || appointmentId;
  const familyName = patientData.familyContactName || 'Family Member';

  // Build message templates based on reminderType
  let messageBody = '';
  switch (reminderType) {
    case 'booking_confirmation':
      messageBody = `Apollo Hospital: Hi ${patientName}! Your appointment is confirmed. Doctor: ${doctorName}. Date: ${dateStr}. Time: ${timeStr}. Booking ID: ${bookingId}. Reply 1 to confirm.`;
      break;
    case '48h':
      if (persona === 'working_professional') {
        messageBody = `Hi ${patientName}! Plan ahead: appointment with ${doctorName} in 48 hours on ${dateStr} at ${timeStr}. Arrange your leave today. Reply 1 to confirm, 2 to reschedule.`;
      } else {
        messageBody = `Hi ${patientName}! Reminder: appointment with ${doctorName} in 2 days on ${dateStr} at ${timeStr}. Reply 1 to confirm, 2 to reschedule.`;
      }
      break;
    case '24h':
      messageBody = `Hi ${patientName}! Your appointment is tomorrow. Doctor: ${doctorName}. Time: ${timeStr}. Location: Apollo Hospital, Jubilee Hills. Reply 1 to confirm.`;
      break;
    case 'morning':
      messageBody = `Good morning ${patientName}! Reminder: ${doctorName} today at ${timeStr}. Reply 1 if you're coming.`;
      break;
    case 'family_notification':
      messageBody = `Hi ${familyName}, ${patientName}'s appointment with ${doctorName} is on ${dateStr} at ${timeStr}. Reply 1 to confirm you'll bring them.`;
      break;
    default:
      messageBody = `Hi ${patientName}! Reminder for your appointment with ${doctorName} on ${dateStr} at ${timeStr}. Reply 1 to confirm.`;
  }

  console.log(`[sendWhatsAppReminderLogic] Sending WhatsApp to ${formattedPhone}`);

  // Load Twilio configurations
  const twilioConfig = functions.config().twilio || {};
  const twilioSid = twilioConfig.sid || process.env.TWILIO_ACCOUNT_SID;
  const twilioToken = twilioConfig.token || process.env.TWILIO_AUTH_TOKEN;
  const twilioWhatsapp = twilioConfig.whatsapp || process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886';

  let twilioMessageSid = 'mock_sid_' + Math.random().toString(36).substring(7);
  let status = 'sent';

  if (twilioSid && twilioToken) {
    try {
      const twilio = require('twilio');
      const client = twilio(twilioSid, twilioToken);
      const response = await client.messages.create({
        from: twilioWhatsapp,
        to: `whatsapp:${formattedPhone}`,
        body: messageBody
      });
      twilioMessageSid = response.sid;
      console.log(`[sendWhatsAppReminderLogic] Twilio success: ${response.sid}`);
    } catch (err) {
      console.error('[sendWhatsAppReminderLogic] Twilio failure:', err.message);
      status = 'failed';
    }
  } else {
    console.log(`[sendWhatsAppReminderLogic] Twilio mock. Body:\n"${messageBody}"`);
  }

  // Log in reminders
  await db.collection(COLLECTIONS.REMINDERS).add({
    appointmentId,
    patientId: apptData.patientId,
    reminderType,
    channel: 'whatsapp',
    status,
    messageBody,
    sentAt: admin.firestore.FieldValue.serverTimestamp(),
    twilioMessageSid
  });

  // Update sending flags in the appointment document
  const updateFlags = {};
  if (reminderType === 'booking_confirmation') updateFlags.reminderSentBooking = true;
  if (reminderType === '48h') updateFlags.reminderSent48h = true;
  if (reminderType === '24h') updateFlags.reminderSent24h = true;
  if (reminderType === 'morning') updateFlags.reminderSentMorning = true;
  if (reminderType === 'family_notification') updateFlags.reminderSentFamily = true;

  if (Object.keys(updateFlags).length > 0) {
    await db.collection(COLLECTIONS.APPOINTMENTS).doc(appointmentId).update(updateFlags);
  }

  return status === 'sent';
};

const makeVoiceCallLogic = async (appointmentId, callType) => {
  const db = admin.firestore();

  // 1. Fetch appointment details
  const apptSnap = await db.collection(COLLECTIONS.APPOINTMENTS).doc(appointmentId).get();
  if (!apptSnap.exists) {
    console.error(`[makeVoiceCallLogic] Appointment not found: ${appointmentId}`);
    return false;
  }
  const apptData = apptSnap.data();

  // 2. Fetch patient details
  const patientSnap = await db.collection(COLLECTIONS.PATIENTS).doc(apptData.patientId).get();
  if (!patientSnap.exists) {
    console.error(`[makeVoiceCallLogic] Patient not found: ${apptData.patientId}`);
    return false;
  }
  const patientData = patientSnap.data();

  // 3. Fetch doctor details
  const docSnap = await db.collection(COLLECTIONS.DOCTORS).doc(apptData.doctorId).get();
  const docData = docSnap.exists ? docSnap.data() : {};

  const recipientPhone = patientData.phone;
  const formattedPhone = validateAndFormatPhone(recipientPhone);
  if (!formattedPhone) {
    console.log(`[makeVoiceCallLogic] Invalid phone number, skipping WhatsApp/call: ${recipientPhone}`);
    return false;
  }

  console.log(`[makeVoiceCallLogic] Initiating voice call to ${formattedPhone}`);

  const vapiConfig = functions.config().vapi || {};
  const vapiApiKey = vapiConfig.key || process.env.VAPI_API_KEY;
  const vapiAssistantId = vapiConfig.assistant_id || process.env.VAPI_ASSISTANT_ID;

  let callId = 'mock_call_' + Math.random().toString(36).substring(7);
  let callStatus = 'initiated';

  if (vapiApiKey && vapiAssistantId) {
    try {
      const axios = require('axios');
      const response = await axios.post('https://api.vapi.ai/call', {
        phoneNumberId: vapiConfig.phone_number_id || null,
        assistantId: vapiAssistantId,
        customer: {
          number: formattedPhone
        },
        assistantOverrides: {
          variableValues: {
            patientName: patientData.name || 'Patient',
            doctorName: apptData.doctorName || docData.name || 'Doctor',
            appointmentDate: apptData.appointmentDate || '',
            appointmentTime: apptData.appointmentTime || '',
            callType: callType
          }
        }
      }, {
        headers: {
          'Authorization': `Bearer ${vapiApiKey}`,
          'Content-Type': 'application/json'
        }
      });
      callId = response.data.id;
      console.log(`[makeVoiceCallLogic] Vapi success. ID: ${callId}`);
    } catch (err) {
      console.error('[makeVoiceCallLogic] Vapi failure:', err.response ? err.response.data : err.message);
      callStatus = 'failed';
    }
  } else {
    console.log(`[makeVoiceCallLogic] Vapi config missing. Mock voice call type: "${callType}"`);
  }

  // Log in reminders
  await db.collection(COLLECTIONS.REMINDERS).add({
    appointmentId,
    patientId: apptData.patientId,
    reminderType: callType,
    channel: 'voice_call',
    status: callStatus,
    sentAt: admin.firestore.FieldValue.serverTimestamp(),
    vapiCallId: callId
  });

  return callStatus === 'initiated';
};

// ==========================================
// PATIENT WELCOME MESSAGING & VOICE HELPERS
// ==========================================

const sendWelcomeWhatsAppLogic = async (patientId, patientData) => {
  const db = admin.firestore();
  const recipientPhone = patientData.phone;
  const formattedPhone = validateAndFormatPhone(recipientPhone);
  if (!formattedPhone) {
    console.log(`[sendWelcomeWhatsAppLogic] Invalid phone number, skipping WhatsApp/call: ${recipientPhone}`);
    return false;
  }

  const patientName = patientData.name || 'Patient';
  const messageBody = `Namaste ${patientName}! Welcome to Apollo OPD Intelligence. You're now registered. Book your first appointment anytime.`;

  console.log(`[sendWelcomeWhatsAppLogic] Sending WhatsApp to ${formattedPhone}`);

  const twilioConfig = functions.config().twilio || {};
  const twilioSid = twilioConfig.sid || process.env.TWILIO_ACCOUNT_SID;
  const twilioToken = twilioConfig.token || process.env.TWILIO_AUTH_TOKEN;
  const twilioWhatsapp = twilioConfig.whatsapp || process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886';

  let twilioMessageSid = 'mock_sid_' + Math.random().toString(36).substring(7);
  let status = 'sent';

  if (twilioSid && twilioToken) {
    try {
      const twilio = require('twilio');
      const client = twilio(twilioSid, twilioToken);
      const response = await client.messages.create({
        from: twilioWhatsapp,
        to: `whatsapp:${formattedPhone}`,
        body: messageBody
      });
      twilioMessageSid = response.sid;
      console.log(`[sendWelcomeWhatsAppLogic] Twilio success: ${response.sid}`);
    } catch (err) {
      console.error('[sendWelcomeWhatsAppLogic] Twilio failure:', err.message);
      status = 'failed';
    }
  } else {
    console.log(`[sendWelcomeWhatsAppLogic] Twilio mock. Body:\n"${messageBody}"`);
  }

  await db.collection(COLLECTIONS.REMINDERS).add({
    appointmentId: 'none',
    patientId,
    reminderType: 'welcome',
    channel: 'whatsapp',
    status,
    messageBody,
    sentAt: admin.firestore.FieldValue.serverTimestamp(),
    twilioMessageSid
  });

  return status === 'sent';
};

const makeWelcomeVoiceCallLogic = async (patientId, patientData) => {
  const db = admin.firestore();
  const recipientPhone = patientData.phone;
  const formattedPhone = validateAndFormatPhone(recipientPhone);
  if (!formattedPhone) {
    console.log(`[makeWelcomeVoiceCallLogic] Invalid phone number, skipping WhatsApp/call: ${recipientPhone}`);
    return false;
  }

  console.log(`[makeWelcomeVoiceCallLogic] Initiating voice call to ${formattedPhone}`);

  const vapiConfig = functions.config().vapi || {};
  const vapiApiKey = vapiConfig.key || process.env.VAPI_API_KEY;
  const vapiAssistantId = vapiConfig.assistant_id || process.env.VAPI_ASSISTANT_ID;

  let callId = 'mock_call_' + Math.random().toString(36).substring(7);
  let callStatus = 'initiated';

  if (vapiApiKey && vapiAssistantId) {
    try {
      const axios = require('axios');
      const response = await axios.post('https://api.vapi.ai/call', {
        phoneNumberId: vapiConfig.phone_number_id || null,
        assistantId: vapiAssistantId,
        customer: {
          number: formattedPhone
        },
        assistantOverrides: {
          variableValues: {
            patientName: patientData.name || 'Patient',
            callType: 'welcome'
          }
        }
      }, {
        headers: {
          'Authorization': `Bearer ${vapiApiKey}`,
          'Content-Type': 'application/json'
        }
      });
      callId = response.data.id;
      console.log(`[makeWelcomeVoiceCallLogic] Vapi success. ID: ${callId}`);
    } catch (err) {
      console.error('[makeWelcomeVoiceCallLogic] Vapi failure:', err.response ? err.response.data : err.message);
      callStatus = 'failed';
    }
  } else {
    console.log(`[makeWelcomeVoiceCallLogic] Vapi config missing. Mock welcome call initiated.`);
  }

  await db.collection(COLLECTIONS.REMINDERS).add({
    appointmentId: 'none',
    patientId,
    reminderType: 'welcome',
    channel: 'voice_call',
    status: callStatus,
    sentAt: admin.firestore.FieldValue.serverTimestamp(),
    vapiCallId: callId
  });

  return callStatus === 'initiated';
};

// ==========================================
// 1. CLOUD FUNCTION: sendWhatsAppReminder (Callable)
// ==========================================

exports.sendWhatsAppReminder = functions.https.onCall(async (data, context) => {
  const { appointmentId, reminderType } = data;
  if (!appointmentId || !reminderType) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing appointmentId or reminderType');
  }

  const success = await sendWhatsAppReminderLogic(appointmentId, reminderType);
  return { success };
});

// ==========================================
// 2. CLOUD FUNCTION: handleWhatsAppWebhook (HTTP POST)
// ==========================================

exports.handleWhatsAppWebhook = functions.https.onRequest(async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  const { From, Body } = req.body;
  if (!From || !Body) {
    return res.status(400).send('Missing From or Body parameters');
  }

  const db = admin.firestore();
  const rawPhone = From.replace('whatsapp:', '').trim();

  const phoneVariants = [rawPhone];
  if (rawPhone.startsWith('+91')) {
    phoneVariants.push(rawPhone.replace('+91', ''));
  } else {
    phoneVariants.push('+91' + rawPhone);
  }

  console.log(`[handleWhatsAppWebhook] Received WhatsApp message from: ${rawPhone}, Body: "${Body}"`);

  try {
    let patientDoc = null;
    const patientQuery = await db.collection(COLLECTIONS.PATIENTS)
      .where('phone', 'in', phoneVariants)
      .get();
    
    if (!patientQuery.empty) {
      patientDoc = patientQuery.docs[0];
    } else {
      console.log(`[handleWhatsAppWebhook] Patient not found for: ${rawPhone}`);
      return sendTwiMLResponse(res, "Apollo Hospital: We could not find a registered profile for this phone number.");
    }

    const patientId = patientDoc.id;
    const patientData = patientDoc.data();

    // Find most recent pending/confirmed appointment
    const apptsQuery = await db.collection(COLLECTIONS.APPOINTMENTS)
      .where('patientId', '==', patientId)
      .get();

    let recentAppt = null;
    if (!apptsQuery.empty) {
      const allAppts = apptsQuery.docs.map(d => ({ id: d.id, ...d.data() }));
      const activeAppts = allAppts.filter(a => ['confirmed', 'pending'].includes(a.status));
      
      if (activeAppts.length > 0) {
        activeAppts.sort((a, b) => a.appointmentDate.localeCompare(b.appointmentDate));
        recentAppt = activeAppts[0];
      }
    }

    let responseText = '';
    const cleanBody = Body.trim();

    if (cleanBody === '1') {
      if (recentAppt) {
        await db.collection(COLLECTIONS.APPOINTMENTS).doc(recentAppt.id).update({
          status: 'confirmed',
          patientConfirmed: true,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        responseText = `Thank you! Your appointment with Dr. ${recentAppt.doctorName} is confirmed.`;
      } else {
        responseText = "You do not have any active appointments to confirm.";
      }
    } else if (cleanBody === '2') {
      if (recentAppt) {
        const appointmentId = recentAppt.id;
        const apptRef = db.collection(COLLECTIONS.APPOINTMENTS).doc(appointmentId);
        
        await db.runTransaction(async (transaction) => {
          transaction.update(apptRef, {
            status: "rescheduled",
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });

          // Free slot
          const slotQ = await db.collection(COLLECTIONS.DOCTOR_SLOTS)
            .where("doctorId", "==", recentAppt.doctorId)
            .where("date", "==", recentAppt.appointmentDate)
            .where("time", "==", recentAppt.appointmentTime)
            .get();
          
          if (!slotQ.empty) {
            const slotDocRef = db.collection(COLLECTIONS.DOCTOR_SLOTS).doc(slotQ.docs[0].id);
            transaction.update(slotDocRef, {
              isAvailable: true,
              appointmentId: null
            });
          }

          // Check waitlist
          const waitlistQ = await db.collection(COLLECTIONS.WAITLIST)
            .where("doctorId", "==", recentAppt.doctorId)
            .where("preferredDate", "==", recentAppt.appointmentDate)
            .where("status", "==", "waiting")
            .get();
          
          waitlistQ.docs.forEach((wlDoc) => {
            const wlData = wlDoc.data();
            const wlDocRef = db.collection(COLLECTIONS.WAITLIST).doc(wlDoc.id);
            
            transaction.update(wlDocRef, {
              status: "notified",
              notifiedAt: admin.firestore.FieldValue.serverTimestamp()
            });

            const wlNotifyRef = db.collection(COLLECTIONS.NOTIFICATIONS).doc();
            transaction.set(wlNotifyRef, {
              patientId: wlData.patientId,
              type: "update",
              title: "Slot Available",
              body: `A slot opened with Dr. ${recentAppt.doctorName} on ${recentAppt.appointmentDate}. Tap to book.`,
              read: false,
              channel: "system",
              createdAt: admin.firestore.FieldValue.serverTimestamp()
            });
          });
        });

        responseText = `We'll help you reschedule. Visit Apollo Hospital or call 1800-XXX.`;
      } else {
        responseText = "You do not have any active appointments to reschedule.";
      }
    } else if (cleanBody === '3') {
      responseText = `Apollo Hospitals Jubilee Hills direction link: https://maps.google.com/?q=Apollo+Hospitals+Jubilee+Hills`;
    } else if (/^\d{10}$/.test(cleanBody)) {
      await db.collection(COLLECTIONS.PATIENTS).doc(patientId).update({
        familyContactPhone: cleanBody,
        familyContactName: 'Family Contact',
        familyContactRelation: 'Caretaker',
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      responseText = `Caretaker mobile number has been set to +91${cleanBody}. We will notify them of upcoming appointments.`;
    } else {
      responseText = `Apollo Hospital OPD: Reply:
1 to Confirm appointment
2 to Reschedule / Cancel
3 to get Location directions on Google Maps
Enter 10-digit number to add/update your Family Caretaker mobile number.`;
    }

    await db.collection(COLLECTIONS.REMINDERS).add({
      appointmentId: recentAppt?.id || 'none',
      patientId,
      reminderType: 'reply',
      channel: 'whatsapp',
      status: 'received',
      messageBody: Body,
      sentAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return sendTwiMLResponse(res, responseText);
  } catch (err) {
    console.error('[handleWhatsAppWebhook] Webhook error:', err);
    return res.status(500).send('Internal Server Error');
  }
});

function sendTwiMLResponse(res, text) {
  res.writeHead(200, { 'Content-Type': 'text/xml' });
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${escapeXml(text)}</Message>
</Response>`;
  return res.end(xml);
}

function escapeXml(unsafe) {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
    }
  });
}

// ==========================================
// 3. CLOUD FUNCTION: makeVoiceCall (Callable)
// ==========================================

exports.makeVoiceCall = functions.https.onCall(async (data, context) => {
  const { appointmentId, callType } = data;
  if (!appointmentId || !callType) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing appointmentId or callType');
  }

  const success = await makeVoiceCallLogic(appointmentId, callType);
  return { success };
});

// ==========================================
// 4. CLOUD FUNCTION: scheduledReminderCheck (Hourly Cron)
// ==========================================

exports.scheduledReminderCheck = functions.pubsub.schedule('every 1 hours').onRun(async (context) => {
  const db = admin.firestore();
  const today = new Date();
  
  const formatYMD = (d) => d.toISOString().split('T')[0];

  const todayStr = formatYMD(today);

  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  const tomorrowStr = formatYMD(tomorrow);

  const twoDaysLater = new Date();
  twoDaysLater.setDate(today.getDate() + 2);
  const twoDaysLaterStr = formatYMD(twoDaysLater);

  console.log(`[scheduledReminderCheck] Date window: Today=${todayStr}, Tomorrow=${tomorrowStr}, 48h=${twoDaysLaterStr}`);

  const activeApptsQuery = await db.collection(COLLECTIONS.APPOINTMENTS)
    .where('status', 'in', ['confirmed', 'pending'])
    .where('appointmentDate', 'in', [todayStr, tomorrowStr, twoDaysLaterStr])
    .get();

  if (activeApptsQuery.empty) {
    console.log('[scheduledReminderCheck] No upcoming appointments found in scan.');
    return null;
  }

  let remindersSentCount = 0;

  for (const docSnap of activeApptsQuery.docs) {
    const apptId = docSnap.id;
    const apptData = docSnap.data();
    const apptDate = apptData.appointmentDate;
    const persona = apptData.persona || 'default';

    // A. 48h Scan
    if (apptDate === twoDaysLaterStr && !apptData.reminderSent48h) {
      console.log(`[scheduledReminderCheck] Sending 48h reminder for: ${apptId}`);
      await sendWhatsAppReminderLogic(apptId, '48h');
      remindersSentCount++;
    }

    // B. 24h Scan
    if (apptDate === tomorrowStr) {
      if (!apptData.reminderSent24h) {
        console.log(`[scheduledReminderCheck] Sending 24h reminder for: ${apptId}`);
        await sendWhatsAppReminderLogic(apptId, '24h');
        remindersSentCount++;
      }
      
      // Elderly checks
      if (persona === 'elderly') {
        if (!apptData.reminderSentFamily) {
          console.log(`[scheduledReminderCheck] Sending family alert for Elderly appt: ${apptId}`);
          await sendWhatsAppReminderLogic(apptId, 'family_notification');
          remindersSentCount++;
        }
        if (!apptData.callSent24h) {
          console.log(`[scheduledReminderCheck] Triggering 24h IVR voice call for Elderly appt: ${apptId}`);
          const callSuccess = await makeVoiceCallLogic(apptId, 'reminder_24h');
          if (callSuccess) {
            await db.collection(COLLECTIONS.APPOINTMENTS).doc(apptId).update({ callSent24h: true });
          }
          remindersSentCount++;
        }
      }
    }

    // C. Today (Morning) Scan
    if (apptDate === todayStr) {
      if (!apptData.reminderSentMorning) {
        console.log(`[scheduledReminderCheck] Sending morning alert for: ${apptId}`);
        await sendWhatsAppReminderLogic(apptId, 'morning');
        remindersSentCount++;
      }

      // Elderly checks
      if (persona === 'elderly' && !apptData.callSentMorning) {
        console.log(`[scheduledReminderCheck] Triggering morning IVR voice call for Elderly appt: ${apptId}`);
        const callSuccess = await makeVoiceCallLogic(apptId, 'reminder_morning');
        if (callSuccess) {
          await db.collection(COLLECTIONS.APPOINTMENTS).doc(apptId).update({ callSentMorning: true });
        }
        remindersSentCount++;
      }
    }
  }

  console.log(`[scheduledReminderCheck] Finished. Total alerts dispatched: ${remindersSentCount}`);
  return { remindersSentCount };
});

// ==========================================
// 5. CLOUD FUNCTION: onAppointmentCreated (Firestore trigger)
// ==========================================

exports.onAppointmentCreated = functions.firestore
  .document('appointments/{appointmentId}')
  .onCreate(async (snap, context) => {
    const appointmentId = context.params.appointmentId;
    const apptData = snap.data();
    const db = admin.firestore();

    console.log(`[onAppointmentCreated] New booking written. ID: ${appointmentId}`);

    // A. Send Booking Confirmation WhatsApp immediately (0 second delay)
    try {
      await sendWhatsAppReminderLogic(appointmentId, 'booking_confirmation');
    } catch (err) {
      console.error('[onAppointmentCreated] WhatsApp booking confirmation failed:', err);
    }

    // Wait exactly 5 seconds (5000ms delay) for demo impact
    await delay(5000);

    // B. Trigger voice call confirmation regardless of persona (5s delay)
    try {
      const callSuccess = await makeVoiceCallLogic(appointmentId, 'confirmation');
      if (callSuccess) {
        await db.collection(COLLECTIONS.APPOINTMENTS).doc(appointmentId).update({
          callSentConfirmation: true
        });
      }
    } catch (err) {
      console.error('[onAppointmentCreated] Voice call confirmation failed:', err);
    }
  });

// ==========================================
// 6. CLOUD FUNCTION: onPatientRegistered (Firestore trigger)
// ==========================================

exports.onPatientRegistered = functions.firestore
  .document('patients/{patientId}')
  .onCreate(async (snap, context) => {
    const patientId = context.params.patientId;
    const patientData = snap.data();

    console.log(`[onPatientRegistered] New patient registered. ID: ${patientId}, Name: ${patientData.name}`);

    // A. Send Welcome WhatsApp immediately (0 second delay)
    try {
      await sendWelcomeWhatsAppLogic(patientId, patientData);
    } catch (err) {
      console.error('[onPatientRegistered] Welcome WhatsApp failed:', err);
    }

    // Wait exactly 8 seconds (8000ms delay) for demo spacing
    await delay(8000);

    // B. Trigger automatic welcome voice call in Hindi (8s delay)
    try {
      await makeWelcomeVoiceCallLogic(patientId, patientData);
    } catch (err) {
      console.error('[onPatientRegistered] Welcome Voice Call failed:', err);
    }
  });
