# 100/100 — CBSE Class 10 Board Exam 2027

An installable, offline-capable Android PWA converted from the supplied HTML dashboard.

## Included

- Original timetable and five session checkboxes.
- Weekday other-subject rotation and Sunday weekly test.
- Chapter tracker for Maths, Science, SST, English, Hindi B and AI.
- Learning / Revised / Not started status controls.
- Difficult-topic watchlist and subject progress indicators.
- Mock-test score graph.
- JSON backup import/export, daily tick reset and print plan.
- PWA manifest, app icons, install prompt and service worker offline cache.
- Initial partial-progress notes for Trigonometry, Light – Reflection and Refraction, and Nationalism in Europe. These are marked Learning, not complete.
- Separate backend/API scaffold for future ChatGPT Study Sync.

## Run locally

A service worker requires localhost or HTTPS. From this folder run:

```bash
python3 -m http.server 8000
```

Open `http://localhost:8000` in Chrome. Browser data is stored locally on that device. Use Export backup regularly to move progress between devices.

## Install on Android

1. Host the contents of this folder on an HTTPS static host (for example, a static hosting provider or your own HTTPS web server).
2. Open the HTTPS site in Chrome on Android.
3. Open Chrome's menu and choose **Install app** or **Add to Home screen** (the wording varies by Chrome version).
4. Launch **100/100** from the home screen. After the first successful load, the app shell is cached for offline use.

This is an Android-installable PWA, not a signed APK. A native APK would require a separate Android packaging/release step.

## Local data and backup

Progress remains in browser `localStorage`; it is not automatically shared between devices. Export backup downloads a JSON file. Import backup restores it. Keep backups private because they contain your study records.

## ChatGPT Study Sync

See `docs/CHATGPT_STUDY_SYNC.md` and `docs/openapi.yaml`. The API is a development scaffold only. No hosting, secret, ChatGPT Action, or end-to-end app sync is configured yet. Do not publish the secret or put it in frontend files.

Run the backend locally:

```bash
cd backend
cp .env.example .env
# Set STUDY_SYNC_TOKEN to a long random secret in your shell/environment.
export STUDY_SYNC_TOKEN="$(openssl rand -hex 32)"
node server.js
```

Then test `GET http://localhost:8787/health`. Authenticated POST requests go to `/api/study-sync`. For deployment, use HTTPS and a host with persistent storage. The JSONL data file is written under `backend/data` by default.

## Important limitations

- A normal PWA cannot read your ChatGPT chat history. Sync requires a private GPT Action or another explicitly authorized integration.
- The API validates and stores study-only events, but the dashboard does not yet pull them into local progress. That authenticated merge step remains future work.
- The API scaffold is single-user and not production-ready for multiple users. Add per-user authorization, rate limiting, idempotency, retention controls and monitored backups before public use.
- The syllabus list is carried over from the source dashboard; confirm 2026–27 chapter inclusion/deletions with official CBSE and school guidance.
