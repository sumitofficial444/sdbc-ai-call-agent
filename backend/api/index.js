// Vercel serverless entry point — do NOT call server.listen() here
import { createStore } from '../src/store.js';
import { createApp } from '../src/app.js';

const origins = new Set([
  'http://127.0.0.1:5173',
  'http://localhost:5173',
  'https://sdbc-ai-call-agent.vercel.app',
  ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : []),
]);

const store = await createStore({
  uri: process.env.MONGODB_URI,
  mode: process.env.LEAD_STORE || 'file',
});

const options = {
  store,
  key: process.env.GEMINI_API_KEY?.trim() || '',
  model: process.env.GEMINI_MODEL || 'gemini-2.0-flash-live-001',
  origins,
};

// Export the Express app — Vercel will wrap it as a serverless function
export default createApp(options);
