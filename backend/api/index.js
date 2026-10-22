// Vercel serverless entry point — do NOT call server.listen() here
import { createStore } from '../src/store.js';
import { createApp } from '../src/app.js';

// Allow localhost + any preview/production Vercel URL for this project + custom FRONTEND_URL
function isAllowedOrigin(origin) {
  if (!origin) return true; // direct browser request (no origin header)
  if (/^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(origin)) return true;
  if (/^https:\/\/sdbc-ai-call-agent[a-z0-9\-]*\.vercel\.app$/.test(origin)) return true;
  if (process.env.FRONTEND_URL && origin === process.env.FRONTEND_URL) return true;
  return false;
}

const store = await createStore({
  uri: process.env.MONGODB_URI,
  mode: process.env.LEAD_STORE || 'file',
});

const options = {
  store,
  isAllowedOrigin,
  key: process.env.GEMINI_API_KEY?.trim() || '',
  model: process.env.GEMINI_MODEL || 'gemini-2.0-flash-live-001',
};

export default createApp(options);

