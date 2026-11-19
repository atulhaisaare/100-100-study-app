# ChatGPT Study Sync — implementation status and setup

## What is implemented in this project

- A Node.js 20+ API scaffold at `backend/server.js`.
- Bearer-token authentication checked server-side using a constant-time comparison.
- Strict allow-list validation for study events only: chapter status, quiz result, weak topic, and study session.
- Rejection of unexpected fields (including transcript/message fields).
- JSONL event persistence with restrictive file permissions and a bounded request size/batch size.
- An OpenAPI 3.1 document in `openapi.yaml` suitable for configuring a ChatGPT GPT Action.

## What is not yet live

- This project cannot read ordinary ChatGPT conversation history automatically. ChatGPT does not grant a static website blanket access to private conversations.
- The Action has not been configured in your ChatGPT account, and no server has been deployed or authenticated.
- The PWA does not yet pull accepted API events into its browser-local dashboard. The API currently receives and stores validated events; a separately authenticated app-sync/read flow is still required before claiming end-to-end sync.
- No sync is active until you deploy the API, set a secret, configure the GPT Action, authorize its use, and test it.

## Recommended user-authorized workflow

1. Deploy this API behind HTTPS on a host with persistent storage.
2. Generate a unique random token (32+ random bytes). Store it as `STUDY_SYNC_TOKEN` in the hosting provider's secret manager. Never put it in `index.html`, JavaScript, the manifest, or a public repository.
3. Configure a private/custom GPT Action using `openapi.yaml`, replacing the server URL with your deployed API URL. Choose API Key authentication with Bearer as the authorization scheme and enter the token in the Action configuration UI.
4. Add instructions to that private GPT so it proposes only structured study events and asks for confirmation before sending them. The API rejects fields outside its study-event schema.
5. Test with one harmless chapter-status event and verify the accepted event in the protected API response/log. Test rejection of an unexpected `conversation` or `transcript` field.
6. Before production use, implement the app-side authenticated pull/merge flow, user identity/session management, rate limiting, audit/retention controls, backups, and idempotency. Do not share one global token across users.

## Event examples

Chapter status:

```json
{"type":"chapter_status","subject":"Maths","chapter":"Introduction to Trigonometry","status":"learning","topic":"Trigonometry basics","source":"chatgpt"}
```

Quiz result:

```json
{"type":"quiz_result","subject":"Science","chapter":"Light – Reflection and Refraction","topic":"Mirror formula numericals","score":8,"total":10,"source":"chatgpt"}
```

Weak topic:

```json
{"type":"weak_topic","subject":"SST","chapter":"The Rise of Nationalism in Europe","topic":"Civil Code of 1808 criticism","source":"chatgpt"}
```

Study session:

```json
{"type":"study_session","subject":"Maths","chapter":"Introduction to Trigonometry","session":"9:00–11:00 AM","date":"2026-11-20","source":"chatgpt"}
```

## Security notes

- HTTPS is mandatory for deployment.
- Keep the API token only in server-side secrets and the private Action authentication settings.
- Restrict CORS to the exact deployed app origin if browser requests are enabled later.
- The current scaffold is a single-user development baseline, not a production multi-user identity system. Add per-user OAuth/session authorization and rate limiting before sharing or public deployment.
- Study content is minimized by design: do not send conversation text, personal messages, or unrelated personal information.
