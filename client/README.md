# LinkFolio Client

This folder contains the React + TypeScript frontend for LinkFolio.

## Local development

Use the root-level workflow as the single source of truth:

- Open [../README.md](../README.md)
- Follow **Quick Start with Makefile**

## Local API connection warning

The client runs a startup check against `/api/health` and shows a warning banner if the configured local API is unreachable.

If you see **Local API connection warning**, verify the API base URL in `client/.env`:

```env
VITE_API_BASE_URL=http://localhost:10000
```

After changing `.env`, restart the client dev server.
