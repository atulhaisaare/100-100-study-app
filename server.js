// Minimal Node.js 20+ API scaffold. No third-party runtime dependencies.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const PORT = Number(process.env.PORT || 8787);
const TOKEN = process.env.STUDY_SYNC_TOKEN || '';
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '';
const subjects = new Set(['Maths','Science','SST','English','Hindi','AI']);
const types = new Set(['chapter_status','quiz_result','weak_topic','study_session']);
const statuses = new Set(['not_started','learning','revised']);
function send(res, status, data) { res.writeHead(status, {'content-type':'application/json; charset=utf-8','cache-control':'no-store'}); res.end(JSON.stringify(data)); }
function validString(v, max=180) { return typeof v === 'string' && v.trim().length > 0 && v.length <= max && !/[<>]/.test(v); }
function validate(e) {
  if (!e || typeof e !== 'object' || Array.isArray(e)) return 'event must be an object';
  if (!types.has(e.type)) return 'unsupported event type';
  if (!subjects.has(e.subject)) return 'unsupported subject';
  if (!validString(e.chapter, 180)) return 'chapter is required';
  if (e.topic !== undefined && !validString(e.topic, 180)) return 'invalid topic';
  if (e.type === 'chapter_status' && !statuses.has(e.status)) return 'invalid chapter status';
  if (e.type === 'quiz_result' && (!Number.isFinite(e.score) || !Number.isFinite(e.total) || e.total <= 0 || e.score < 0 || e.score > e.total)) return 'invalid quiz score';
  if (e.type === 'study_session' && (!validString(e.session, 80) || !validString(e.date, 10))) return 'session and YYYY-MM-DD date are required';
  if (e.type === 'weak_topic' && !validString(e.topic, 180)) return 'weak-topic name is required';
  // Allow only explicitly study-scoped fields. Never accept chat transcripts or arbitrary payloads.
  const allowed = new Set(['type','subject','chapter','topic','status','score','total','session','date','source','event_id']);
  if (Object.keys(e).some(k => !allowed.has(k))) return 'unexpected field; only study data is accepted';
  return null;
}
const server = http.createServer(async (req,res) => {
  if (ALLOWED_ORIGIN && req.headers.origin === ALLOWED_ORIGIN) { res.setHeader('access-control-allow-origin', ALLOWED_ORIGIN); res.setHeader('vary','Origin'); }
  res.setHeader('access-control-allow-headers','authorization,content-type');
  res.setHeader('access-control-allow-methods','GET,POST,OPTIONS');
  if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }
  if (req.url === '/health' && req.method === 'GET') return send(res,200,{ok:true,service:'100/100 study sync API'});
  if (!TOKEN) return send(res,503,{error:'Study Sync is not configured. Set STUDY_SYNC_TOKEN on the server.'});
  const auth = req.headers.authorization || '';
  const supplied = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  const a = Buffer.from(supplied), b = Buffer.from(TOKEN);
  if (a.length !== b.length || !crypto.timingSafeEqual(a,b)) return send(res,401,{error:'Unauthorized'});
  if (req.url === '/api/study-sync' && req.method === 'POST') {
    let body=''; for await (const chunk of req) { body += chunk; if (body.length > 32768) return send(res,413,{error:'Payload too large'}); }
    let parsed; try { parsed=JSON.parse(body); } catch { return send(res,400,{error:'Invalid JSON'}); }
    const events = Array.isArray(parsed) ? parsed : [parsed];
    if (!events.length || events.length > 25) return send(res,400,{error:'Send between 1 and 25 events'});
    for (const event of events) { const err=validate(event); if (err) return send(res,400,{error:err}); }
    fs.mkdirSync(DATA_DIR,{recursive:true});
    const stamped = events.map(e=>({ ...e, received_at:new Date().toISOString(), event_id:e.event_id || crypto.randomUUID() }));
    fs.appendFileSync(path.join(DATA_DIR,'study-events.jsonl'),stamped.map(e=>JSON.stringify(e)).join('\n')+'\n',{mode:0o600});
    return send(res,202,{accepted:stamped.length,events:stamped.map(e=>({event_id:e.event_id,type:e.type,subject:e.subject}))});
  }
  if (req.url === '/api/study-sync' && req.method === 'GET') {
    const file=path.join(DATA_DIR,'study-events.jsonl');
    if (!fs.existsSync(file)) return send(res,200,{events:[]});
    const events=fs.readFileSync(file,'utf8').trim().split('\n').filter(Boolean).slice(-100).map(x=>JSON.parse(x));
    return send(res,200,{events});
  }
  return send(res,404,{error:'Not found'});
});
server.listen(PORT,()=>console.log(`100/100 Study Sync API listening on ${PORT}`));
