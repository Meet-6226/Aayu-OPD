# ⚡ Apollo OPD — Tech Stack & API Cheat Sheet
> **Quick Reference Guide for Hackathon Judges & Presentation**

---

## 🎨 1. FRONTEND (User Interface)
* **Core Framework**: `React 19` + `Vite 8`
  * *Why?* Ultra-fast load speed (700ms builds) and sub-second page rendering.
* **Styling**: `TailwindCSS v4`
  * *Why?* Premium glassmorphism design system & healthcare color tokens.
* **Animations**: `Framer Motion 12`
  * *Why?* Smooth page transitions, entrance reveals, and interactive micro-animations.
* **Charts & Visuals**: `Recharts 3.9` + `GSAP 3.15`
  * *Why?* Real-time hospital load graphs, revenue-at-risk charts, and SHAP risk bars.
* **Icons**: `Lucide React`
  * *Why?* Over 1,000 clean, modern vector icons.

---

## ⚡ 2. BACKEND & DATABASE
* **Database**: `Firebase Cloud Firestore`
  * *Real-Time Sync*: Uses `onSnapshot` listeners to sync Doctor & Patient portals in 0 milliseconds without refreshing.
  * *Concurrency Safety*: Uses `runTransaction` to prevent double-booking during slot recovery.
* **Authentication**: `Firebase Auth` + Custom Session Manager
  * *Why?* Role-based access control for Patients vs. Hospital Staff.
* **Cloud Functions**: `Firebase Cloud Functions` (Node.js)
  * *Why?* Automated background waitlist processing and security rule validation.

---

## 🧠 3. AI / MACHINE LEARNING SERVICE
* **Server**: `Python 3.10` + `FastAPI 0.111` (Served via `Uvicorn` on Port 8000)
* **ML Model**: `XGBoost 2.0` (Extreme Gradient Boosting Classifier)
  * *Function*: Predicts patient no-show probability using commute distance, booking lead time, age, historical attendance, and weather.
  * *Risk Tiers*:
    * 🔴 **HIGH Risk**: ≥ 70% no-show chance
    * 🟡 **MEDIUM Risk**: 40% – 69% no-show chance
    * 🟢 **LOW Risk**: < 40% no-show chance
* **Explainable AI (XAI)**: `SHAP 0.45` (SHapley Additive exPlanations)
  * *Function*: Shows exact reasons *why* a patient is flagged (e.g. `Traffic Delay +40% · 14-Day Lead Time +25%`).
* **Data Processing**: `Pandas 2.2`, `NumPy 1.26`, `Scikit-Learn 1.5`, `Pydantic v2`

---

## 🌐 4. EXTERNAL APIs & INTEGRATIONS

### 📍 1. Google Maps Distance Matrix API
* **Endpoint**: `maps.googleapis.com/maps/api/distancematrix/json`
* **Parameters**: `mode=driving`, `departure_time=now`, `traffic_model=best_guess`
* **Function**: Calculates exact road distance (km), driving time, peak-hour traffic delay (`+25 min delay`), and optimal departure window.

### 🗺️ 2. Google Maps Geocoding API
* **Endpoint**: `maps.googleapis.com/maps/api/geocode/json`
* **Function**: Reverse-geocodes patient GPS latitude/longitude into human-readable city street address.

### 📐 3. Haversine Math Formula (Fallback Engine)
* **Function**: Mathematical spatial geometry formula used as an automatic offline fallback if GPS or Google API quota is unavailable.

### 💬 4. WhatsApp Dispatch API
* **Function**: Sends 1-Click Digital Prescriptions, appointment booking alerts, persona-tailored reminders, and waitlist slot recovery notifications to patient WhatsApp.

### 🆔 5. ABHA Health Locker Integration
* **Function**: Syncs verified ABHA ID (`91-8273-9182-10`) with vital signs (BP, SpO2, Heart Rate) and digital diagnostic lab reports.

---

## 🗣️ 15-SECOND PITCH FOR JUDGES
> *"Apollo OPD is built on **React 19 & Vite**, synced in real-time via **Firebase Cloud Firestore**. Our prediction engine is a **Python FastAPI service running XGBoost with SHAP explainability**, powered by **Google Maps Distance Matrix API** for traffic-aware routing and **WhatsApp API** for 1-Click Digital Prescriptions & Slot Recovery."*
