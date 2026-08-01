#!/usr/bin/env python3
"""
Nidaan One Backend Server
- Flutter Web static serving
- Twilio/Vapi CORS Proxy
- Emergency Response API (GPS dispatch, AI triage, deduplication, tracking, ABHA)
"""
import http.server
import json
import urllib.request
import urllib.parse
import base64
import os
import sys
import traceback
import math
import time
import uuid
import threading

PORT = 8080
WEB_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'build', 'web')

# Twilio config
TWILIO_SID = os.environ.get("TWILIO_SID", "YOUR_TWILIO_SID")
TWILIO_TOKEN = os.environ.get("TWILIO_TOKEN", "YOUR_TWILIO_AUTH_TOKEN")
TWILIO_WA_FROM = os.environ.get("TWILIO_WA_FROM", "whatsapp:+14155238886")
TWILIO_SMS_FROM = os.environ.get("TWILIO_SMS_FROM", "+14155238886")  # For hospital SMS alerts

# Vapi config
VAPI_API_KEY = os.environ.get("VAPI_API_KEY", "YOUR_VAPI_API_KEY")
VAPI_ASSISTANT_ID = os.environ.get("VAPI_ASSISTANT_ID", "YOUR_VAPI_ASSISTANT_ID")
VAPI_PHONE_NUMBER_ID = os.environ.get("VAPI_PHONE_NUMBER_ID", "YOUR_VAPI_PHONE_NUMBER_ID")

# Gemini Vision API for AI severity analysis
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")

DEMO_VERIFIED_PHONES = [
    "+919876543210",  # Demo User 1
    "+919876543211",  # Demo User 2
    "+919876543212",  # Demo User 3
]
DEMO_VERIFIED_PHONE = "+919876543210"

# ─── In-memory stores (replace with DB in production) ───────────────────────
# Active emergency reports: { report_id -> report_dict }
_active_reports = {}
_reports_lock = threading.Lock()

# Consent tokens: { consent_token -> { abha_id, report_id, expires_at } }
_consent_tokens = {}

# Mock ambulance fleet
_mock_ambulances = [
    {
        "id": "amb-001",
        "vehicle_number": "DL-01-AB-1234",
        "driver_name": "Rajesh Kumar",
        "driver_phone": "+91-9876543210",
        "base_lat": 28.6139,
        "base_lng": 77.2090,
        "status": "idle",
    },
    {
        "id": "amb-002",
        "vehicle_number": "DL-02-CD-5678",
        "driver_name": "Suresh Sharma",
        "driver_phone": "+91-9123456789",
        "base_lat": 28.6350,
        "base_lng": 77.2245,
        "status": "idle",
    },
]

# Mock hospitals dataset
_mock_hospitals = [
    {
        "id": "hosp-001",
        "name": "Apollo Hospital",
        "latitude": 28.6129,
        "longitude": 77.2295,
        "specialities": ["Trauma", "Neurology", "Cardiology", "Orthopedics"],
        "trauma_bay_ready": True,
        "available_beds": 12,
        "contact_number": "+91-11-26925801",
        "distance_km": 0.0,
        "preparation_status": "notified",
    },
    {
        "id": "hosp-002",
        "name": "Safdarjung Hospital",
        "latitude": 28.5680,
        "longitude": 77.2090,
        "specialities": ["Trauma", "Burns", "Emergency"],
        "trauma_bay_ready": False,
        "available_beds": 5,
        "contact_number": "+91-11-26730000",
        "distance_km": 0.0,
        "preparation_status": "notified",
    },
    {
        "id": "hosp-003",
        "name": "AIIMS Delhi",
        "latitude": 28.5672,
        "longitude": 77.2100,
        "specialities": ["Trauma", "Burns", "Neurosurgery", "Cardiac"],
        "trauma_bay_ready": True,
        "available_beds": 8,
        "contact_number": "+91-11-26588500",
        "distance_km": 0.0,
        "preparation_status": "notified",
    },
]


# ─── Utility Functions ───────────────────────────────────────────────────────

def log(msg):
    sys.stdout.write(f"{msg}\n")
    sys.stdout.flush()


def haversine_distance(lat1, lng1, lat2, lng2):
    """Calculate distance between two GPS coordinates in meters."""
    R = 6371000  # Earth radius in meters
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lng2 - lng1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def estimate_eta_seconds(distance_m, emergency=True):
    """Estimate ETA in seconds - realistic 3 to 5 minutes (180s - 300s)."""
    # Speed: ~40 km/h + mobilization. Clamp between 180s (3m) and 300s (5m)
    eta = int(distance_m / 11.1) + 60
    return max(180, min(300, eta))


def find_nearest_ambulance(lat, lng):
    """Find nearest ambulance dynamically positioned relative to user's location."""
    # Place ambulance ~1.8 km away from user location for realistic 4 min ETA
    amb = dict(_mock_ambulances[0])
    amb["base_lat"] = lat + 0.012
    amb["base_lng"] = lng + 0.012
    dist_m = haversine_distance(lat, lng, amb["base_lat"], amb["base_lng"])
    return amb, dist_m


def find_nearest_hospitals(lat, lng, severity, emergency_type, limit=3):
    """Find and rank hospitals by distance + suitability."""
    # Specialty match preferences per emergency type
    specialty_map = {
        "road_accident": ["Trauma", "Neurology", "Orthopedics"],
        "fire": ["Burns", "Trauma", "Emergency"],
        "medical_emergency": ["Cardiology", "Emergency", "Neurology"],
        "fall_injury": ["Orthopedics", "Trauma", "Neurology"],
        "other": ["Trauma", "Emergency"],
    }
    preferred = specialty_map.get(emergency_type, ["Trauma"])

    scored = []
    for hosp in _mock_hospitals:
        dist = haversine_distance(lat, lng, hosp["latitude"], hosp["longitude"])
        dist_km = dist / 1000
        # Score: lower distance better, bonus for matching specialty, bonus for trauma_bay_ready
        specialty_score = sum(1 for s in hosp["specialities"] if s in preferred)
        ready_bonus = 1 if hosp["trauma_bay_ready"] and severity == "critical" else 0
        beds_ok = 1 if hosp["available_beds"] > 0 else 0
        score = specialty_score + ready_bonus + beds_ok - (dist_km * 0.2)

        hospital = dict(hosp)
        hospital["distance_km"] = round(dist_km, 2)
        hospital["score"] = score
        scored.append(hospital)

    scored.sort(key=lambda h: (-h["score"], h["distance_km"]))
    return scored[:limit]


def call_gemini_vision(base64_image, mime_type):
    """Call Gemini Vision API for accident severity analysis."""
    if not GEMINI_API_KEY:
        return None

    prompt = (
        "You are an emergency medical triage assistant. Analyse this accident scene image and determine:\n"
        "1. severity: minor (no visible injuries, minor damage), moderate (visible injuries, significant damage), "
        "or critical (severe injuries, entrapment, fire risk, multiple casualties)\n"
        "2. confidence: float 0.0-1.0\n"
        "3. reasoning: max 15 words\n"
        "4. suggested_hospital_type: e.g. 'Level 1 Trauma Centre', 'Burns Unit', 'General Emergency'\n"
        "5. flags: array from [multiple_casualties, fire_risk, entrapment, spinal_injury_risk, burns, cardiac_arrest_visible]\n"
        "Return ONLY valid JSON with keys: severity, confidence, reasoning, suggested_hospital_type, flags. No markdown."
    )

    request_body = {
        "contents": [
            {
                "parts": [
                    {"text": prompt},
                    {
                        "inline_data": {
                            "mime_type": mime_type,
                            "data": base64_image,
                        }
                    },
                ]
            }
        ],
        "generationConfig": {
            "temperature": 0.1,
            "maxOutputTokens": 300,
        },
    }

    try:
        req_data = json.dumps(request_body).encode()
        req = urllib.request.Request(
            f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={GEMINI_API_KEY}",
            data=req_data,
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=30) as resp:
            resp_data = json.loads(resp.read())
            text = resp_data["candidates"][0]["content"]["parts"][0]["text"]
            # Strip markdown if any
            text = text.strip()
            if text.startswith("```"):
                text = text.split("```")[1]
                if text.startswith("json"):
                    text = text[4:]
            return json.loads(text.strip())
    except Exception as e:
        log(f"[Gemini] Error: {e}")
        return None


def send_sms_alert(phone, message):
    """Send SMS via Twilio API."""
    try:
        url = f"https://api.twilio.com/2010-04-01/Accounts/{TWILIO_SID}/Messages.json"
        data = urllib.parse.urlencode({
            'From': TWILIO_SMS_FROM,
            'To': phone,
            'Body': message
        }).encode('utf-8')

        req = urllib.request.Request(url, data=data, method='POST')
        auth = base64.b64encode(f"{TWILIO_SID}:{TWILIO_TOKEN}".encode()).decode()
        req.add_header('Authorization', f'Basic {auth}')
        req.add_header('Content-Type', 'application/x-www-form-urlencoded')
        req.add_header('User-Agent', 'Mozilla/5.0')

        with urllib.request.urlopen(req, timeout=10) as resp:
            log(f"[SMS] ✅ Sent to {phone}: HTTP {resp.status}")
            return resp.status in (200, 201)
    except Exception as e:
        log(f"[SMS] ❌ Error sending to {phone}: {e}")
        return False


def send_whatsapp_alert(phone, message):
    """Send WhatsApp message via Twilio API."""
    try:
        url = f"https://api.twilio.com/2010-04-01/Accounts/{TWILIO_SID}/Messages.json"
        to_phone = phone if phone.startswith('whatsapp:') else f"whatsapp:{phone}"
        data = urllib.parse.urlencode({
            'From': TWILIO_WA_FROM,
            'To': to_phone,
            'Body': message
        }).encode('utf-8')

        req = urllib.request.Request(url, data=data, method='POST')
        auth = base64.b64encode(f"{TWILIO_SID}:{TWILIO_TOKEN}".encode()).decode()
        req.add_header('Authorization', f'Basic {auth}')
        req.add_header('Content-Type', 'application/x-www-form-urlencoded')
        req.add_header('User-Agent', 'Mozilla/5.0')

        with urllib.request.urlopen(req, timeout=10) as resp:
            log(f"[WhatsApp] ✅ Sent to {phone}: HTTP {resp.status}")
            return resp.status in (200, 201)
    except Exception as e:
        log(f"[WhatsApp] ❌ Error sending to {phone}: {e}")
        return False


# ─── HTTP Handler ────────────────────────────────────────────────────────────

class ProxyHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=WEB_DIR, **kwargs)

    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Consent-Token')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_GET(self):
        # Emergency tracking polling endpoint
        if self.path.startswith('/api/emergency/tracking/'):
            report_id = self.path.split('/')[-1]
            self._handle_emergency_tracking(report_id)
        elif self.path.startswith('/api/emergency/check-duplicate'):
            self._handle_check_duplicate()
        elif self.path.startswith('/api/emergency/nearest-hospitals'):
            self._handle_nearest_hospitals()
        elif self.path.startswith('/api/abha/emergency-summary/'):
            abha_id = self.path.split('/')[-1]
            self._handle_abha_summary(abha_id)
        else:
            super().do_GET()

    def do_POST(self):
        if self.path == '/api/send-whatsapp':
            self._handle_whatsapp()
        elif self.path == '/api/voice-call':
            self._handle_voice_call()
        elif self.path == '/api/emergency/report':
            self._handle_emergency_report()
        elif self.path == '/api/emergency/analyze-image':
            self._handle_analyze_image()
        elif self.path == '/api/abha/emergency-consent':
            self._handle_abha_consent()
        elif self.path.startswith('/api/emergency/') and '/hospital-update' in self.path:
            parts = self.path.split('/')
            report_id = parts[3] if len(parts) > 3 else ''
            self._handle_hospital_update(report_id)
        else:
            self.send_error(404)

    def do_DELETE(self):
        if self.path.startswith('/api/emergency/cancel/'):
            report_id = self.path.split('/')[-1]
            self._handle_cancel_emergency(report_id)
        else:
            self.send_error(404)

    def _read_body(self):
        length = int(self.headers.get('Content-Length', 0))
        if length == 0:
            return {}
        raw = self.rfile.read(length)
        try:
            return json.loads(raw)
        except Exception:
            return {}

    def _send_json(self, code, data):
        body = json.dumps(data).encode()
        self.send_response(code)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(body)

    def _parse_query(self):
        from urllib.parse import urlparse, parse_qs
        parsed = urlparse(self.path)
        return parse_qs(parsed.query)

    # ── Emergency: Submit Report ─────────────────────────────────────────────
    def _handle_emergency_report(self):
        try:
            payload = self._read_body()
            log(f"[Emergency] New report: {payload.get('type')} at {payload.get('latitude')},{payload.get('longitude')}")

            report_id = payload.get('id') or str(uuid.uuid4())
            lat = float(payload.get('latitude', 0))
            lng = float(payload.get('longitude', 0))
            emergency_type = payload.get('type', 'road_accident')
            severity = payload.get('severity', 'unknown')

            if lat == 0 and lng == 0:
                self._send_json(400, {'error': 'Invalid GPS coordinates'})
                return

            # Find nearest ambulance
            ambulance, dist_m = find_nearest_ambulance(lat, lng)
            if ambulance is None:
                self._send_json(503, {'error': 'No ambulances available'})
                return

            # Find best hospitals
            hospitals = find_nearest_hospitals(lat, lng, severity, emergency_type, limit=3)
            primary_hospital = hospitals[0] if hospitals else None

            eta_seconds = estimate_eta_seconds(dist_m)

            # Build ambulance response with simulated current position near user
            amb_response = {
                "id": ambulance["id"],
                "vehicle_number": ambulance["vehicle_number"],
                "driver_name": ambulance["driver_name"],
                "driver_phone": ambulance["driver_phone"],
                "current_latitude": ambulance["base_lat"],
                "current_longitude": ambulance["base_lng"],
                "eta_seconds": eta_seconds,
                "status": "en_route",
                "route_polyline": "",
            }

            # Mark ambulance as dispatched
            ambulance["status"] = "dispatched"

            # Store active report
            report_data = {
                "id": report_id,
                "type": emergency_type,
                "latitude": lat,
                "longitude": lng,
                "severity": severity,
                "status": "dispatched",
                "reported_at": payload.get('reported_at', ''),
                "reporter_user_id": payload.get('reporter_user_id'),
                "abha_id": payload.get('abha_id'),
                "assigned_ambulance": ambulance["id"],
                "assigned_hospital": primary_hospital["id"] if primary_hospital else None,
                "eta_seconds": eta_seconds,
                "tracking_token": str(uuid.uuid4()),
            }
            with _reports_lock:
                _active_reports[report_id] = report_data

            # Send hospital notification asynchronously
            if primary_hospital:
                hospital_msg = (
                    f"🚨 INCOMING EMERGENCY — NIDAAN ALERT\n\n"
                    f"Patient ETA: {eta_seconds // 60} minutes\n"
                    f"Location: {payload.get('location_address', f'{lat},{lng}')}\n"
                    f"Emergency Type: {emergency_type.replace('_', ' ').title()}\n"
                    f"Severity: {severity.upper()}\n"
                    f"Ambulance: {ambulance['vehicle_number']} | Driver: {ambulance['driver_name']}\n\n"
                    f"Please prepare emergency bay.\n— Nidaan Emergency Response Network"
                )
                for demo_phone in DEMO_VERIFIED_PHONES:
                    send_whatsapp_alert(demo_phone, hospital_msg)
                log(f"[Emergency] Hospital alert sent for report {report_id}")

            # Dispatch notification to demo phones (simulating driver notification)
            driver_msg = (
                f"🚑 EMERGENCY DISPATCH\n"
                f"Type: {emergency_type.replace('_', ' ').title()}\n"
                f"Location: {payload.get('location_address', f'{lat},{lng}')}\n"
                f"Severity: {severity.upper()}\n"
                f"Maps: https://maps.google.com/?daddr={lat},{lng}"
            )
            send_whatsapp_alert(DEMO_VERIFIED_PHONES[0], driver_msg)

            self._send_json(200, {
                "report_id": report_id,
                "status": "dispatched",
                "assigned_ambulance": amb_response,
                "assigned_hospital": primary_hospital,
                "all_hospitals": hospitals,
                "eta_seconds": eta_seconds,
                "tracking_token": report_data["tracking_token"],
            })
            log(f"[Emergency] ✅ Report {report_id} dispatched. ETA: {eta_seconds}s. Ambulance: {ambulance['id']}")

        except Exception as e:
            log(f"[Emergency] FATAL: {traceback.format_exc()}")
            self._send_json(500, {'error': str(e)})

    # ── Emergency: AI Image Analysis ─────────────────────────────────────────
    def _handle_analyze_image(self):
        try:
            payload = self._read_body()
            base64_image = payload.get('image', '')
            mime_type = payload.get('mime_type', 'image/jpeg')

            if not base64_image:
                self._send_json(400, {'error': 'No image provided'})
                return

            log(f"[AI] Analyzing image ({len(base64_image)} chars base64)...")
            result = call_gemini_vision(base64_image, mime_type)

            if result:
                log(f"[AI] Analysis result: {result.get('severity')} (confidence: {result.get('confidence')})")
                self._send_json(200, {
                    "severity": result.get("severity", "unknown"),
                    "confidence": float(result.get("confidence", 0.0)),
                    "reasoning": result.get("reasoning", "Analysis complete"),
                    "suggested_hospital_type": result.get("suggested_hospital_type", "Emergency Department"),
                    "flags": result.get("flags", []),
                })
            else:
                # If Gemini not configured, return unknown (NOT a fake severity)
                log(f"[AI] Gemini not available (no API key or error)")
                self._send_json(200, {
                    "severity": "unknown",
                    "confidence": 0.0,
                    "reasoning": "Analysis unavailable",
                    "suggested_hospital_type": None,
                    "flags": [],
                })
        except Exception as e:
            log(f"[AI] Error: {traceback.format_exc()}")
            self._send_json(500, {'error': str(e)})

    # ── Emergency: Duplicate Check ───────────────────────────────────────────
    def _handle_check_duplicate(self):
        try:
            params = self._parse_query()
            lat = float(params.get('lat', ['0'])[0])
            lng = float(params.get('lng', ['0'])[0])
            radius = float(params.get('radius_meters', ['200'])[0])
            window_min = int(params.get('window_minutes', ['15'])[0])
            now = time.time()

            with _reports_lock:
                for rid, report in _active_reports.items():
                    if report.get('status') in ('cancelled', 'failed'):
                        continue
                    dist = haversine_distance(lat, lng, report['latitude'], report['longitude'])
                    # Parse reported_at (ISO format)
                    try:
                        from datetime import datetime, timezone
                        reported_str = report.get('reported_at', '')
                        if reported_str:
                            reported_ts = datetime.fromisoformat(reported_str.replace('Z', '+00:00')).timestamp()
                            age_minutes = (now - reported_ts) / 60
                        else:
                            age_minutes = 0
                    except Exception:
                        age_minutes = 0

                    if dist <= radius and age_minutes <= window_min:
                        log(f"[Duplicate] Matched report {rid} at {dist:.0f}m, age {age_minutes:.1f}min")
                        self._send_json(200, {
                            "is_duplicate": True,
                            "existing_report_id": rid,
                            "existing_ambulance_eta_seconds": report.get('eta_seconds', 300),
                            "message": f"An ambulance is already en route (ETA ~{report.get('eta_seconds', 300) // 60} min)",
                        })
                        return

            self._send_json(200, {
                "is_duplicate": False,
                "existing_report_id": None,
                "existing_ambulance_eta_seconds": None,
                "message": None,
            })
        except Exception as e:
            log(f"[Duplicate] Error: {traceback.format_exc()}")
            self._send_json(500, {'error': str(e)})

    # ── Emergency: Nearest Hospitals ─────────────────────────────────────────
    def _handle_nearest_hospitals(self):
        try:
            params = self._parse_query()
            lat = float(params.get('lat', ['28.6139'])[0])
            lng = float(params.get('lng', ['77.2090'])[0])
            severity = params.get('severity', ['moderate'])[0]
            emergency_type = params.get('type', ['other'])[0]
            limit = int(params.get('limit', ['3'])[0])

            hospitals = find_nearest_hospitals(lat, lng, severity, emergency_type, limit)
            self._send_json(200, {'hospitals': hospitals})
        except Exception as e:
            log(f"[Hospitals] Error: {traceback.format_exc()}")
            self._send_json(500, {'error': str(e)})

    # ── Emergency: Live Tracking (polling) ───────────────────────────────────
    def _handle_emergency_tracking(self, report_id):
        try:
            with _reports_lock:
                report = _active_reports.get(report_id)

            if not report:
                self._send_json(404, {'error': 'Report not found'})
                return

            # Simulate ambulance moving toward victim (decrement ETA)
            eta = max(0, report.get('eta_seconds', 300) - 30)
            with _reports_lock:
                if report_id in _active_reports:
                    _active_reports[report_id]['eta_seconds'] = eta

            lat = report['latitude']
            lng = report['longitude']
            # Simulate ambulance position moving toward victim
            ambulance_lat = lat + 0.005 * (eta / 300)
            ambulance_lng = lng + 0.003 * (eta / 300)

            status = "en_route"
            if eta <= 120:
                status = "two_minutes_away"
            if eta <= 0:
                status = "arrived"

            hospital_id = report.get('assigned_hospital')
            hosp_status = "trauma_bay_ready" if eta < 200 else "staff_notified"

            self._send_json(200, {
                "ambulance_lat": round(ambulance_lat, 6),
                "ambulance_lng": round(ambulance_lng, 6),
                "eta_seconds": eta,
                "status": status,
                "hospital_id": hospital_id,
                "hospital_status": hosp_status,
                "report_status": report.get('status', 'dispatched'),
            })
        except Exception as e:
            log(f"[Tracking] Error: {traceback.format_exc()}")
            self._send_json(500, {'error': str(e)})

    # ── Emergency: Cancel ────────────────────────────────────────────────────
    def _handle_cancel_emergency(self, report_id):
        try:
            payload = self._read_body()
            reason = payload.get('reason', 'mistake')
            with _reports_lock:
                if report_id in _active_reports:
                    _active_reports[report_id]['status'] = 'cancelled'
                    # Free up ambulance
                    for amb in _mock_ambulances:
                        if amb.get('status') == 'dispatched':
                            amb['status'] = 'idle'
                            break
                    log(f"[Emergency] ✅ Report {report_id} cancelled. Reason: {reason}")
                    # Notify driver (stand-down)
                    cancel_msg = f"🟡 STAND DOWN — Emergency report {report_id[:8]} has been cancelled (reason: {reason}). Return to base."
                    for phone in DEMO_VERIFIED_PHONES:
                        send_whatsapp_alert(phone, cancel_msg)
                    self._send_json(200, {'success': True, 'message': 'Report cancelled. Ambulance stood down.'})
                else:
                    self._send_json(404, {'error': 'Report not found'})
        except Exception as e:
            log(f"[Cancel] Error: {traceback.format_exc()}")
            self._send_json(500, {'error': str(e)})

    # ── ABHA: Consent ────────────────────────────────────────────────────────
    def _handle_abha_consent(self):
        try:
            payload = self._read_body()
            abha_id = payload.get('abha_id', '')
            report_id = payload.get('report_id', '')
            reporter_user_id = payload.get('reporter_user_id')

            if not abha_id:
                self._send_json(400, {'error': 'abha_id required'})
                return

            consent_token = str(uuid.uuid4())
            expires_at = time.time() + 3600  # 1 hour
            _consent_tokens[consent_token] = {
                'abha_id': abha_id,
                'report_id': report_id,
                'reporter_user_id': reporter_user_id,
                'expires_at': expires_at,
            }

            log(f"[ABHA] Consent granted for {abha_id}, report {report_id}")
            self._send_json(200, {
                'consent_token': consent_token,
                'expires_at': expires_at,
                'message': 'Emergency access granted',
            })
        except Exception as e:
            log(f"[ABHA] Consent error: {traceback.format_exc()}")
            self._send_json(500, {'error': str(e)})

    # ── ABHA: Summary ────────────────────────────────────────────────────────
    def _handle_abha_summary(self, abha_id):
        try:
            consent_token = self.headers.get('X-Consent-Token', '')
            if not consent_token:
                self._send_json(401, {'error': 'Consent token required'})
                return

            token_data = _consent_tokens.get(consent_token)
            if not token_data:
                self._send_json(403, {'error': 'Invalid or expired consent token'})
                return
            if time.time() > token_data.get('expires_at', 0):
                self._send_json(403, {'error': 'Consent token expired'})
                return
            if token_data.get('abha_id') != abha_id:
                self._send_json(403, {'error': 'Consent token mismatch'})
                return

            # Mock ABHA patient data (in production: call NHA ABHA API)
            self._send_json(200, {
                'abha_id': abha_id,
                'patient_name': 'Ramesh Kumar',
                'blood_group': 'B+',
                'allergies': ['Penicillin', 'Sulfa drugs'],
                'existing_conditions': ['Type 2 Diabetes', 'Hypertension'],
                'current_medications': ['Metformin 500mg', 'Amlodipine 5mg'],
                'emergency_contact_name': 'Priya Kumar',
                'emergency_contact_phone': '+91-9876543210',
                'last_updated': '2026-01-15T00:00:00Z',
            })
            log(f"[ABHA] Summary returned for {abha_id}")
        except Exception as e:
            log(f"[ABHA] Error: {traceback.format_exc()}")
            self._send_json(500, {'error': str(e)})

    # ── Hospital: Status Update ───────────────────────────────────────────────
    def _handle_hospital_update(self, report_id):
        try:
            payload = self._read_body()
            status = payload.get('status', 'staff_notified')
            with _reports_lock:
                if report_id in _active_reports:
                    _active_reports[report_id]['hospital_status'] = status
                    log(f"[Hospital] Report {report_id} hospital status: {status}")
                    self._send_json(200, {'success': True})
                else:
                    self._send_json(404, {'error': 'Report not found'})
        except Exception as e:
            self._send_json(500, {'error': str(e)})

    # ── Existing: WhatsApp ───────────────────────────────────────────────────
    def _handle_whatsapp(self):
        try:
            payload = self._read_body()
            phone = payload.get('phone', '')
            message = payload.get('body', '')

            if not message:
                self._send_json(400, {'error': 'Missing body'})
                return

            digits = ''.join(c for c in phone if c.isdigit())
            if len(digits) >= 10:
                target = '+91' + digits[-10:]
            else:
                target = DEMO_VERIFIED_PHONE

            ok = send_whatsapp_alert(target, message)
            results = [{'target': target, 'status': 'sent' if ok else 'failed'}]

            self._send_json(200, {'success': True, 'results': results})
        except Exception as e:
            log(f"[WhatsApp] FATAL: {traceback.format_exc()}")
            self._send_json(500, {'error': str(e)})

    # ── Existing: Voice Call ─────────────────────────────────────────────────
    def _handle_voice_call(self):
        try:
            payload = self._read_body()
            call_type = payload.get('callType', 'confirmation')
            appt_data = payload.get('appointmentData', {})
            phone = payload.get('phone', '')

            digits = ''.join(c for c in phone if c.isdigit())
            if len(digits) >= 10:
                user_target = '+91' + digits[-10:]
            else:
                user_target = DEMO_VERIFIED_PHONE

            targets = list(set([user_target, DEMO_VERIFIED_PHONE]))
            results = []

            for target in targets:
                try:
                    url = "https://api.vapi.ai/call/phone"
                    headers = {
                        "Authorization": f"Bearer {VAPI_API_KEY}",
                        "Content-Type": "application/json",
                        "User-Agent": "Mozilla/5.0"
                    }
                    body = json.dumps({
                        "phoneNumberId": VAPI_PHONE_NUMBER_ID,
                        "assistantId": VAPI_ASSISTANT_ID,
                        "customer": {"number": target},
                        "assistantOverrides": {
                            "variableValues": {
                                "patientName": appt_data.get('patientName', 'Patient'),
                                "doctorName": appt_data.get('doctorName', 'Doctor'),
                                "appointmentDate": appt_data.get('appointmentDate', ''),
                                "appointmentTime": appt_data.get('appointmentTime', ''),
                                "callType": call_type,
                            }
                        }
                    }).encode('utf-8')

                    req = urllib.request.Request(url, data=body, headers=headers, method='POST')
                    with urllib.request.urlopen(req, timeout=10) as resp:
                        res_data = json.loads(resp.read().decode())
                        log(f"[VoiceCall] ✅ Vapi call success to {target}! ID: {res_data.get('id')}")
                        results.append({'target': target, 'id': res_data.get('id'), 'status': 'success'})
                except Exception as e:
                    log(f"[VoiceCall] ❌ Vapi error for {target}: {e}")
                    results.append({'target': target, 'error': str(e), 'status': 'failed'})

            self._send_json(200, {'success': True, 'results': results})
        except Exception as e:
            log(f"[VoiceCall] ❌ FATAL: {traceback.format_exc()}")
            self._send_json(500, {'error': str(e)})

    def log_message(self, format, *args):
        log(f"{self.address_string()} - [{self.log_date_time_string()}] {format % args}")


if __name__ == '__main__':
    log(f"\n🏥 Nidaan One Backend Server")
    log(f"   Serving: {WEB_DIR}")
    log(f"   Port:    {PORT}")
    log(f"   APIs:    /api/emergency/*, /api/abha/*, /api/send-whatsapp, /api/voice-call")
    log(f"   Gemini:  {'✅ configured' if GEMINI_API_KEY else '⚠️  no API key (set GEMINI_API_KEY env var)'}")
    log(f"   URL:     http://localhost:{PORT}\n")

    with http.server.HTTPServer(('', PORT), ProxyHandler) as httpd:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            log("\nServer stopped.")
