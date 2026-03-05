# Pipecat AI Interview Agent

This agent joins a Daily room, reads scripted interview questions, and records responses via Deepgram STT. It uses ElevenLabs for TTS and does not use an LLM.

## What the backend sends

The app starts a session with a JSON payload similar to:

```json
{
  "questions": [{ "text": "Tell me about yourself." }],
  "script": "1. Tell me about yourself.",
  "voiceId": "your-elevenlabs-voice-id",
  "maxSilenceSeconds": 8,
  "maxRetries": 2
}
```

## Build and push Docker image

1) Log in to Docker Hub:

```bash
docker login
```

2) Build the image (replace `YOUR_USERNAME`):

```bash
docker build -t YOUR_USERNAME/hireme-agent:0.1 .
```

3) Push the image:

```bash
docker push YOUR_USERNAME/hireme-agent:0.1
```

## Deploy in Pipecat Cloud

Use the image you pushed in the **Deploy new agent** form:

```
YOUR_USERNAME/hireme-agent:0.1
```

Set the agent name to something like `hireme-agent`. This is the value you will put in Render as `PIPECAT_AGENT_NAME`.

## Required secrets (Pipecat)

Create a secret set in Pipecat Cloud that includes:

- `DEEPGRAM_API_KEY`
- `ELEVENLABS_API_KEY`
- `ELEVENLABS_VOICE_ID` (optional if you pass `voiceId` in the session body)

You can upload from a local `.env` file using:

```bash
uv run pipecat cloud secrets set hireme-secrets --file .env
```
