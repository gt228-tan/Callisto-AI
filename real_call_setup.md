# 📞 Real AI Phone Call — Setup Complete

## ✅ What's Working

| Component | Status | Details |
|-----------|--------|---------|
| **Twilio** | ✅ Configured | Account SID + Auth Token set |
| **Twilio Phone** | ✅ Active | +17372508034 (outbound caller) |
| **Your Phone** | ✅ Verified | +918758906699 (trial recipient) |
| **Gemini AI** | ✅ Ready | gemini-2.0-flash |
| **Voice Server** | ✅ Running | http://localhost:5006 |
| **ngrok Tunnel** | ✅ Active | https://caucus-unfixable-scrap.ngrok-free.dev |

---

## 🎙️ How the AI Call Works

```
You → Dashboard "Call Me Now" button
         ↓
  Twilio API called → Your phone (+918758906699) rings
         ↓
  You answer → Twilio fetches TwiML from ngrok → Voice Server
         ↓
  Gemini AI generates opening greeting
         ↓
  Amazon Polly Neural TTS speaks the greeting to you
         ↓
  You speak → Twilio Speech Recognition → text transcript
         ↓
  Text → Gemini AI → response → Polly TTS → you hear it
         ↓
  (Conversation loop continues until you hang up)
```

---

## 🚀 Running Services

Three processes must be running simultaneously:

```powershell
# Terminal 1 (CRM Server — already running)
cd server && node server.js

# Terminal 2 (AI Voice Server — already running)
cd server && node twilioVoiceServer.js

# Terminal 3 (ngrok Tunnel — already running)
C:\Users\gtbtb\ngrok\ngrok.exe http 5006

# Terminal 4 (Frontend — already running)
npm run dev
```

---

## 📲 Making a Real AI Call

### Method 1: Dashboard (Recommended)
1. Open the Callisto AI dashboard
2. Navigate to **AI Voice Agent** page
3. In the **Real Phone Calls** panel → click **Outbound** tab
4. Click **"📲 Call Me Now"** — your phone rings immediately!

### Method 2: API
```bash
curl -X POST http://localhost:5006/voice/call-outbound \
  -H "Content-Type: application/json" \
  -d '{"toPhone":"+918758906699","prospectName":"Tanishq","company":"Callisto AI"}'
```

---

## ⚠️ Trial Account Notes

> [!IMPORTANT]
> Twilio trial accounts can only call **verified numbers**. Your verified number is **+918758906699**.
> To call other numbers, upgrade to a paid Twilio account ($20 credit included with trial).

- Trial accounts have 75 free minutes
- The Twilio caller ID will show as **+17372508034**
- `StatusCallback` is not supported on trial accounts (auto-bypassed in code)

---

## 🔄 After Restarting (ngrok URL Changes!)

Each time ngrok restarts, it gets a **new random URL**. You must:

1. Get the new ngrok URL from: `http://localhost:4040`
2. Update `server/.env` → `PUBLIC_URL=https://new-url.ngrok-free.dev`
3. Restart the voice server: `Ctrl+C` then `node twilioVoiceServer.js`

> [!TIP]
> To avoid this, upgrade your ngrok account to get a **static domain** (free tier allows 1 static domain at dashboard.ngrok.com/domains).

---

## 🎯 The AI Persona (Aria)

The AI is configured as **Aria**, an elite Callisto AI sales representative:
- Warm, confident, human-like conversation
- Keeps responses under 60 words (optimized for phone)
- Detects human handoff requests → sends Calendly SMS
- Responds in < 420ms (Gemini Flash model)
- Powered by Amazon Polly Joanna-Neural TTS voice

---

## 📊 Monitoring Calls

- **Real-time dashboard**: AI Voice Agent page → "Real Phone Calls" panel
- **Transcripts**: See every turn of the conversation live
- **WebSocket**: Connects to `ws://localhost:5006/ws/call-monitor`
- **Sessions API**: `GET http://localhost:5006/voice/sessions`
