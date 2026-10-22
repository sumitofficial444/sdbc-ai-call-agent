# SDBC Admissions Voice MVP — MERN

React + Tailwind + Express + Node.js + MongoDB (Mongoose), with Gemini Live audio through a server-side WebSocket relay. This is an independent local prototype, not an official SDBC service.

## Run locally

Prerequisite: Node.js 20.19+ (or a current LTS release).

From this project folder:

```powershell
npm.cmd install
Copy-Item backend/.env.example backend/.env
npm.cmd run dev
```

Open **http://127.0.0.1:5173** in Chrome or Edge. The API listens at `127.0.0.1:8080`. Both servers bind to loopback for this local demo. `npm.cmd` avoids PowerShell execution-policy restrictions on npm.ps1.

The guided text demo, college knowledge and enquiry form work without an API key. Text mode uses curated deterministic answers; it is not a general AI chatbot. It accepts up to six recent messages for interest-based follow-up responses.

## Counsellor behavior

Aditi introduces herself as an AI, discovers education stage and interests, relates listed college features to student goals, handles objections, and invites a suitable next step. The voice policy is editable in `backend/src/counsellor.js`. It calls for short turns, one question at a time, conversational Hindi/Hinglish/English, memory within the call, and no repeated pitch after refusal. Voice sessions now begin with a brief introduction automatically.

Benefit explanations use the existing reference snapshot; they do not establish teaching quality, placements or eligibility. Fees, scholarships, guarantees and bookings must not be invented. The text demo has corresponding curated responses for budget, parents, comparison, interest and next-step questions. Actual speech behavior still requires a Gemini key and listening tests; prompt instructions are not a guarantee of model behavior.

## Enable real voice

1. Create a Gemini API key at https://aistudio.google.com/apikey.
2. Put it in **backend/.env** as `GEMINI_API_KEY=your_key`. Do not paste it into frontend code, commit it, or send it in chat.
3. Keep `GEMINI_MODEL=gemini-3.8-live`, or set an available Live audio model for your account.
4. Restart `npm.cmd run dev` after changing `.env`.
5. Check the audio consent box, click **Start conversation**, allow the microphone and ask a question. Use headphones to reduce echo. Mute and End session release/control the microphone; speaking over the assistant clears interrupted playback when Gemini reports an interruption.

The server creates and configures the provider session; the browser cannot replace its system instructions. Voice uses a scope prompt and a small reference context, not a fully enforced fact-verification or retrieval system. Test off-topic and prompt-injection behavior before any real deployment. Automatic voice activity detection handles turns. Audio capture uses AudioWorklet; audio responses are queued for playback. Each demo call ends after 10 minutes, and at most three concurrent sessions are allowed.

Gemini's published free tier includes Live audio as checked on 15 October 2026, subject to your account/model quotas and terms. This app cannot enforce a Google billing cap. Use a free-tier project and check AI Studio quota. Free-tier inputs may be used for product improvement: use public college facts and dummy student data.

Voice audio and transcripts go through Google. The app does not persist audio recordings or transcripts. Actual voice quality, Hindi/Hinglish and interruption timing require testing with a valid API key and microphone.

## MongoDB — full MERN mode

Start MongoDB Community locally, then set in **backend/.env**:

```dotenv
MONGODB_URI=mongodb://127.0.0.1:27017/sdbc_voice
LEAD_STORE=mongodb
```

Restart the app. The sidebar and `/api/health` will report `mongodb`. Leads are stored in the `leads` collection. An existing MongoDB Atlas URI can also be used; the UI then identifies remote storage. No Atlas account is needed for local MongoDB. Database connection failure stops startup rather than silently switching stores.

If MongoDB is not installed yet, leave `MONGODB_URI` empty and `LEAD_STORE=file`. This explicit quick-demo mode stores enquiries in `backend/data/leads.json`; it is **not MongoDB**. Data is not automatically migrated when you switch storage modes. Test with dummy data.

## College information

Reference: https://sdbc.ac.in/ (checked 15 October 2026). `backend/src/knowledge.json` contains the source URL, snapshot date, program list, campus address, contact number and listed facilities. Programs appear across SDBCE/SDBCT; institute-specific availability must be confirmed. No tuition, hostel fee, eligibility, placement promise, seat count or deadline has been fabricated. Unknown answers redirect to the official admission enquiry team.

Update `knowledge.json` and restart the backend to update the reference. This is a curated website snapshot, not an automatic crawler or RAG index. The campus illustration is decorative, not a photograph of the college.

## Verification and single-server build

```powershell
npm.cmd test
npm.cmd run build
npm.cmd start
```

After building, `npm.cmd start` serves the frontend and API together at **http://127.0.0.1:8080**. In development, Vite proxies `/api` and `/voice` to Express. Set a different backend port only if you also update the Vite proxy.

Tests cover unknown-answer fallback, off-topic requests, enquiry validation and consent, concurrent/persistent file writes, origin restrictions and missing-key voice failure. MongoDB connectivity and end-to-end Gemini audio need the corresponding external services. They are not simulated as successful tests.

## Project layout

- `frontend/src/main.jsx`: dashboard, transcript, enquiry and knowledge screens.
- `frontend/src/voice.js`: mic session, playback and interruption handling.
- `frontend/public/capture-worklet.js`: microphone PCM capture.
- `backend/src/app.js`: API routes and validation boundary.
- `backend/src/store.js`: MongoDB adapter and explicit local-file demo adapter.
- `backend/src/voice.js`: Gemini relay; key stays server-side.
- `backend/src/knowledge.json`: editable college reference facts.

There is no phone-number calling, college notification, callback scheduling, login, document upload or production deployment in this version. Local enquiry endpoints assume a single trusted user; add authentication, access controls and deployment configuration before exposing this dashboard over a network.

Provider docs: https://ai.google.dev/gemini-api/docs/live-api/capabilities and https://ai.google.dev/gemini-api/docs/pricing.
