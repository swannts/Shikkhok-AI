import { createHmac, createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { basename } from 'node:path';
import { Agent } from '/usr/share/nodejs/undici/index.js';

const AI_URL = process.env.AI_URL ?? 'http://localhost:8000';
const API_URL = process.env.API_URL ?? 'http://localhost:4000';
const SECRET = process.env.AI_SERVICE_SECRET ?? 'dev-internal-ai-service-secret-at-least-32chars';
const localHttpAgent = new Agent({ headersTimeout: 0, bodyTimeout: 0, connectTimeout: 30_000 });

const books = [
  ['6ac0ba93801ade91ce8be280', 'services/ai/data/curriculum/2026/class-3/amar-bangla-boi.pdf'],
  ['6ac0c56b801ade91ce8bf544', 'services/ai/data/curriculum/2026/class-2/amar-bangla-boi.pdf'],
  ['6ac0c56d801ade91ce8bf55f', 'services/ai/data/curriculum/2026/class-2/english-for-today.pdf'],
  ['6ac0c56f801ade91ce8bf57f', 'services/ai/data/curriculum/2026/class-2/primary-math.pdf'],
  ['6ac0c571801ade91ce8bf598', 'services/ai/data/curriculum/2026/class-3/bangladesh-and-global-studies.pdf'],
  ['6ac0c573801ade91ce8bf5b1', 'services/ai/data/curriculum/2026/class-3/buddhist-religion-studies.pdf'],
  ['6ac0c575801ade91ce8bf5d3', 'services/ai/data/curriculum/2026/class-3/christian-religion-studies.pdf'],
  ['6ac0c579801ade91ce8bf601', 'services/ai/data/curriculum/2026/class-3/hindu-religion-studies.pdf'],
  ['6ac0c57c801ade91ce8bf621', 'services/ai/data/curriculum/2026/class-3/islamic-studies.pdf'],
  ['6ac0c57e801ade91ce8bf63a', 'services/ai/data/curriculum/2026/class-3/primary-math.pdf'],
  ['6ac0c596801ade91ce8bf689', 'services/ai/data/curriculum/2026/class-3/english-for-today.pdf'],
  ['6ac0c59c801ade91ce8bf6c2', 'services/ai/data/curriculum/2026/class-3/primary-science.pdf'],
];

function signedHeaders(method, path, body) {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const bodyHash = createHash('sha256').update(body).digest('hex');
  const canonical = `${timestamp}\n${method}\n${path}\n${bodyHash}`;
  const signature = createHmac('sha256', SECRET).update(canonical).digest('hex');
  return {
    'content-type': 'application/json',
    'x-service-name': 'shikkhok-worker',
    'x-service-timestamp': timestamp,
    'x-service-signature': signature,
    'x-request-id': `manual-curriculum-${Date.now()}`,
  };
}

const startIndex = Number.parseInt(process.env.START_INDEX ?? '0', 10);
for (const [index, [bookId, filePath]] of books.entries()) {
  if (index < startIndex) continue;
  const pdf = await readFile(filePath);
  const form = new FormData();
  form.append('file', new Blob([pdf], { type: 'application/pdf' }), basename(filePath));
  form.append('class_level', filePath.includes('/class-2/') ? '2' : '3');
  form.append('subject_id', bookId);
  form.append('subject_title', basename(filePath, '.pdf'));
  form.append('source_book', basename(filePath));
  form.append('curriculum_year', '2026');
  form.append('curriculum_version', '2026-NCTB');
  form.append('book_id', bookId);
  form.append('source_name', basename(filePath));
  form.append('structure_only', 'true');
  console.log(`OCR: ${filePath}`);
  const aiPath = '/api/v1/ingestion/pdf';
  const request = new Request(`${AI_URL}${aiPath}`, { method: 'POST', body: form });
  const requestBody = new Uint8Array(await request.arrayBuffer());
  const aiSignature = signedHeaders('POST', aiPath, requestBody);
  aiSignature['content-type'] = request.headers.get('content-type');
  const aiResponse = await fetch(`${AI_URL}${aiPath}`, {
    method: 'POST',
    headers: aiSignature,
    body: requestBody,
    dispatcher: localHttpAgent,
  });
  if (!aiResponse.ok) throw new Error(`OCR failed for ${filePath}: ${aiResponse.status}`);
  const result = await aiResponse.json();
  const sections = Array.isArray(result.sections) ? result.sections : [];
  console.log(`  sections: ${sections.length}`);
  if (sections.length === 0) continue;
  const path = `/api/v1/internal/curriculum/${bookId}/structure`;
  for (let offset = 0; offset < sections.length; offset += 3) {
    const batch = sections.slice(offset, offset + 3);
    const body = JSON.stringify({ sections: batch });
    const response = await fetch(`${API_URL}${path}`, {
      method: 'POST',
      headers: signedHeaders('POST', path, body),
      body,
    });
    const responseText = await response.text();
    if (!response.ok) {
      throw new Error(`Persistence failed for ${filePath} batch ${offset}: ${response.status} ${responseText}`);
    }
    console.log(`  persisted batch ${offset + 1}-${Math.min(offset + batch.length, sections.length)}: ${responseText}`);
  }
}
