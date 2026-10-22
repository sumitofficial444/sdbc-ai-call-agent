import mongoose from 'mongoose';
import { mkdir, readFile, writeFile, rename } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const DEFAULT_DIR = process.env.VERCEL ? '/tmp/sdbc-data' : fileURLToPath(new URL('../data/', import.meta.url));
export async function createStore({ uri, mode = 'file', directory = DEFAULT_DIR } = {}) {
    if (uri) {
        const connection = await mongoose.createConnection(uri, { serverSelectionTimeoutMS: 5000, bufferCommands: false }).asPromise();
        const Lead = connection.model('Lead', new mongoose.Schema({ id: { type: String, required: true, unique: true }, name: { type: String, required: true, maxLength: 100 }, phone: { type: String, required: true, match: /^[6-9][0-9]{9}$/ }, course: { type: String, required: true }, consent: { type: Boolean, required: true }, created_at: { type: String, required: true } }, { versionKey: false }));
        return { mode: 'mongodb', remote: !/^mongodb:\/\/(127\.0\.0\.1|localhost)(:|\/)/.test(uri), async list() { return Lead.find().sort({ created_at: -1 }).limit(500).select('-_id -consent').lean(); }, async add(lead) { const record = { ...lead, id: randomUUID(), created_at: new Date().toISOString() }; await Lead.create(record); return record; }, close: () => connection.close() };
    }
    if (mode !== 'file') throw new Error('MONGODB_URI is required for MongoDB storage.');
    await mkdir(directory, { recursive: true }); const filename = path.join(directory, 'leads.json'); let queue = Promise.resolve();
    async function read() { try { return JSON.parse(await readFile(filename, 'utf8')); } catch (e) { if (e.code === 'ENOENT') return []; throw e; } }
    return { mode: 'file', remote: false, async list() { await queue; return (await read()).sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 500); }, add(lead) { const task = queue.then(async () => { const rows = await read(); const record = { ...lead, id: randomUUID(), created_at: new Date().toISOString() }; rows.push(record); await writeFile(filename + '.tmp', JSON.stringify(rows, null, 2), 'utf8'); await rename(filename + '.tmp', filename); return record; }); queue = task.catch(() => { }); return task; }, close: async () => { await queue; } };
}
