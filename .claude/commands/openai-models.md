# List OpenAI Models

Fetch current available models from OpenAI API to verify model IDs.

## Instructions

Use the OpenAI API key from .env.local to list available models:

```bash
# Read API key and list models
OPENAI_KEY=$(grep OPENAI_API_KEY /mnt/a/dev/grimforge-site/.env.local | cut -d'=' -f2)
curl -s https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_KEY" | \
  python3 -c "import sys,json; d=json.load(sys.stdin); [print(m['id']) for m in sorted(d.get('data',[]), key=lambda x:x['id']) if 'gpt' in m['id'].lower() or m['id'].startswith('o')]"
```

Report back with:
- List of GPT models available
- List of o-series reasoning models
- Any new models since last check
- Confirm current models in assistant/route.ts are valid
