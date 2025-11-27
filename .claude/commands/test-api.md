# Test API Endpoints

Test key API endpoints on the dev branch deployment.

## Instructions

Test these endpoints against https://dev-claude--obsidianriterecords.netlify.app:

### Voice API
```bash
# List voices (should return ElevenLabs voices)
curl -s "https://dev-claude--obsidianriterecords.netlify.app/api/admin/voice/voices" | head -500
```

### Assistant API (requires auth - will return 401 without session)
```bash
curl -s "https://dev-claude--obsidianriterecords.netlify.app/api/admin/assistant" \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"hello"}]}'
```

### Health Check
```bash
curl -s "https://dev-claude--obsidianriterecords.netlify.app/status"
```

Report back with:
- HTTP status codes
- Any error messages
- Whether APIs are responding correctly
