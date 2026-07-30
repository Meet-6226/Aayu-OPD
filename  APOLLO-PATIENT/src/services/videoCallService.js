/**
 * Daily.co Video Call Integration Service
 */

const DAILY_API_KEY = import.meta.env.VITE_DAILY_API_KEY || "";

/**
 * Creates a unique Daily.co video room for a given appointment.
 * 
 * @param {string} appointmentId 
 * @param {string} appointmentDate - format "YYYY-MM-DD"
 * @param {string} appointmentTime - format "HH:MM AM/PM" (e.g. "10:30 AM")
 * @returns {Promise<string>} - Returns the room URL
 */
export async function createVideoRoom(appointmentId, appointmentDate, appointmentTime) {
  const roomName = `aayu-consult-${appointmentId}`;
  
  // Calculate expiration time (2 hours after scheduled time)
  let exp = null;
  try {
    if (appointmentDate && appointmentTime) {
      // e.g. "2026-07-10 10:30 AM"
      const dateStr = `${appointmentDate} ${appointmentTime}`;
      const scheduledDate = new Date(dateStr);
      if (!isNaN(scheduledDate.getTime())) {
        exp = Math.floor(scheduledDate.getTime() / 1000) + (2 * 3600); // 2 hours after
      }
    }
  } catch (e) {
    console.warn("[VideoCallService] Failed to calculate exp timestamp:", e);
  }

  // Fallback room URL in case API key is missing or call fails
  const fallbackUrl = `https://aayu-test.daily.co/${roomName}`;

  if (!DAILY_API_KEY) {
    console.warn("[VideoCallService] VITE_DAILY_API_KEY not configured. Returning simulated/fallback URL.");
    return fallbackUrl;
  }

  try {
    const payload = {
      name: roomName,
      properties: {
        max_participants: 2,
        enable_screenshare: true,
        eject_at_room_exp: true
      }
    };

    if (exp) {
      payload.properties.exp = exp;
    }

    const response = await fetch("https://api.daily.co/v1/rooms", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${DAILY_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errText = await response.text();
      console.warn(`[VideoCallService] API call failed: ${response.status} ${errText}`);
      
      if (errText.includes("already exists")) {
        return `https://aayu-test.daily.co/${roomName}`;
      }
      return fallbackUrl;
    }

    const data = await response.json();
    console.log("[VideoCallService] Room created successfully on Daily.co:", data.url);
    return data.url;

  } catch (error) {
    console.error("[VideoCallService] Error creating video room:", error);
    return fallbackUrl;
  }
}
