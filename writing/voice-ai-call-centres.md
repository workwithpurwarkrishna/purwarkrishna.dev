---
title: "How Call Centres Use Voice AI to Automate Conversations"
description: "How modern Voice AI systems replace legacy IVR menus — the STT/LLM/TTS stack, real-world deployments, and a practical guide to building a production call centre agent."
date: 2025-03-14
category: "AI Engineering"
readTime: "11 min"
topics: ["voice-ai", "stt", "tts", "llm"]
---

Instead of forcing customers through *"Press 1 for billing, Press 2 for support"* menus, modern call centres let callers speak naturally and get answers immediately. Voice AI listens, understands intent, hits your backend systems, and responds — all in real time, all without a human agent for routine queries.

This isn't replacing call centre teams. It's automating the 60–70% of calls that are repetitive: order status, balance checks, appointment booking, password resets. Human agents handle what actually needs judgment.

## Why IVR Systems Are Being Replaced

Traditional IVR (Interactive Voice Response) forces callers through rigid decision trees. If your issue doesn't match a menu option, you're stuck. Every extra keypress adds friction, and friction turns into abandonment or agent escalation — both expensive.

Voice AI swaps the menu for a conversation. A caller says *"Where's my order?"* — the system understands the intent, pulls the order status from your CRM, and responds. No keypad navigation, no hold music while the IVR re-reads options. The interaction feels like talking to a person who already knows your account.

## The Technology Stack

Four components run in sequence on every call:

**Speech-to-Text (STT / ASR)** — converts the caller's audio to text in milliseconds. Production-grade models (Deepgram Nova-2, AssemblyAI, Whisper) handle accents, background noise, and domain-specific vocabulary via custom word lists.

**Language model (LLM)** — takes the transcript, understands intent, decides what action to take or what to say. For call centre use cases, GPT-4o-mini gives a strong balance of speed and capability.

**Text-to-Speech (TTS)** — converts the response back to audio. Cartesia and ElevenLabs both produce natural-sounding voices with under 100ms first-byte latency.

**Integrations** — CRM lookups, order APIs, appointment systems. The agent calls these mid-conversation via function calling to get real data before it speaks.

## Real-World Deployments

**BarmeniaGothaer (Germany)** deployed a Voice AI agent (*Mina*, built on Parloa) to manage call routing across 50+ destinations. Switchboard workload dropped by 90%.

**HSE** replaced its DTMF hotline with *EASY AI*, now handling up to 3 million calls per year with a 10% cross-sell rate — the agent upsells during conversations without human involvement.

**E.ON** uses *OneVoice* for meter readings, billing enquiries, and outage reports, resolving nearly half of all inbound calls automatically.

## Building a Production Voice AI Agent

A working call centre agent needs: telephony (Twilio), real-time audio streaming (LiveKit), STT (Deepgram), LLM (OpenAI), and TTS (Cartesia). Here's how they wire together.

**Call flow:** Customer dials Twilio number → Twilio routes via Elastic SIP Trunk → LiveKit SIP endpoint receives the call → Python agent joins the LiveKit room → agent listens, generates responses, speaks back.

### Step 1: Install dependencies

```bash
npm install -g twilio-cli
curl -sSL https://get.livekit.io/cli | bash
```

```bash
pip install \
  livekit-agents \
  livekit-plugins-openai \
  livekit-plugins-deepgram \
  livekit-plugins-cartesia \
  livekit-plugins-silero \
  python-dotenv
```

### Step 2: Create a Twilio Elastic SIP Trunk

```bash
# Create the trunk
twilio api:core:sip:trunks:create \
  --friendly-name "VoiceAI-Trunk" \
  --domain-name "voiceai-trunk.pstn.twilio.com"

# Add origination URI pointing at your LiveKit SIP endpoint
twilio api:core:sip:trunks:origination-urls:create \
  --trunk-sid <TWILIO_TRUNK_SID> \
  --sip-url "sip:<YOUR_LIVEKIT_SIP_URI>" \
  --weight 1 --priority 1 --enabled true \
  --friendly-name "LiveKit"

# Associate your Twilio phone number with the trunk
twilio api:core:sip:trunks:phone-numbers:create \
  --trunk-sid <TWILIO_TRUNK_SID> \
  --phone-number-sid <TWILIO_PHONE_SID>
```

### Step 3: Configure LiveKit inbound trunk and dispatch rule

`inbound-trunk.json` — tells LiveKit to accept calls from Twilio:

```json
{
  "trunk": {
    "name": "Twilio Inbound",
    "numbers": ["+1XXXXXXXXXX"],
    "allowed_addresses": ["54.172.60.0/23"]
  }
}
```

`dispatch-rule.json` — routes each inbound call into its own room:

```json
{
  "rule": {
    "dispatchRuleIndividual": {
      "roomPrefix": "call-"
    }
  }
}
```

Apply both with the LiveKit CLI:

```bash
livekit-cli create-sip-inbound-trunk --request inbound-trunk.json
livekit-cli create-sip-dispatch-rule --request dispatch-rule.json
```

### Step 4: The Python voice agent

```python
# main.py
import asyncio
from dotenv import load_dotenv
from livekit.agents import AutoSubscribe, JobContext, WorkerOptions, cli, llm
from livekit.agents.voice_assistant import VoiceAssistant
from livekit.plugins import cartesia, deepgram, openai, silero

load_dotenv()

SYSTEM_PROMPT = """
You are Aria, an AI customer support agent for TechCorp.
You help customers with: order tracking, billing questions,
Tier-1 troubleshooting, and scheduling callbacks with human agents.
Be concise — callers are on the phone, not reading a wall of text.
Ask for an order number or account ID early if relevant.
If the issue is complex or emotional, offer a warm transfer to a human agent.
"""

async def entrypoint(ctx: JobContext):
    await ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)

    initial_ctx = llm.ChatContext().append(
        role="system",
        text=SYSTEM_PROMPT,
    )

    assistant = VoiceAssistant(
        vad=silero.VAD.load(),               # Voice Activity Detection
        stt=deepgram.STT(model="nova-2"),    # Speech-to-Text
        llm=openai.LLM(model="gpt-4o-mini"),  # Language Model
        tts=cartesia.TTS(voice="sonic-english"),  # Text-to-Speech
        chat_ctx=initial_ctx,
    )

    assistant.start(ctx.room)
    await asyncio.sleep(0.5)

    await assistant.say(
        "Hi, you've reached TechCorp support. I'm Aria, your AI assistant. "
        "How can I help you today?",
        allow_interruptions=True,
    )

    await asyncio.sleep(3600)  # keep agent alive for the call duration


if __name__ == "__main__":
    cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint))
```

### Step 5: Environment variables and running

`.env`:

```bash
LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=your_livekit_api_key
LIVEKIT_API_SECRET=your_livekit_api_secret
DEEPGRAM_API_KEY=your_deepgram_api_key
OPENAI_API_KEY=your_openai_api_key
CARTESIA_API_KEY=your_cartesia_api_key
```

Run in dev mode:

```bash
python main.py dev
```

Any call to your Twilio number now routes through to LiveKit, and the Python agent picks it up instantly.

## Adding Tool Calls (Agentic Capabilities)

The real power is when the agent can take action mid-call — look up order status, schedule callbacks, update account details. LiveKit's `FunctionContext` wires directly into OpenAI function calling:

```python
from livekit.plugins import openai
from livekit.agents import llm

fnc_ctx = llm.FunctionContext()

@fnc_ctx.ai_callable(description="Look up order status by order ID")
async def get_order_status(order_id: str) -> str:
    result = await your_orders_api.get(order_id)
    return f"Order {order_id} is {result.status}, expected {result.eta}"

@fnc_ctx.ai_callable(description="Schedule a callback with a human agent")
async def schedule_callback(customer_phone: str, reason: str) -> str:
    await your_crm.create_callback_ticket(customer_phone, reason)
    return "I've scheduled a callback for you within 2 hours."

# Add fnc_ctx to VoiceAssistant
assistant = VoiceAssistant(
    vad=silero.VAD.load(),
    stt=deepgram.STT(model="nova-2"),
    llm=openai.LLM(model="gpt-4o-mini"),
    tts=cartesia.TTS(voice="sonic-english"),
    fnc_ctx=fnc_ctx,
    chat_ctx=initial_ctx,
)
```

The agent calls `get_order_status()` or `schedule_callback()` autonomously when it detects the caller needs it. No extra prompting from your side.

## Production Considerations

**Latency** — the full STT → LLM → TTS round-trip should stay under 1 second. Anything above that starts to feel unnatural. Deepgram's streaming API and Cartesia's low-latency mode both help. Use `gpt-4o-mini` over `gpt-4o` unless you need the extra capability.

**Barge-in** — callers interrupt constantly. Your system must detect speech during playback (Silero VAD handles this) and cut the audio immediately. LiveKit's `allow_interruptions=True` does this at the framework level.

**PII redaction** — credit card numbers, account IDs, and Social Security Numbers must be masked in transcripts before they're logged. Both Deepgram and AssemblyAI offer built-in PII redaction. This is mandatory for PCI-DSS and GDPR compliance.

**Warm handoff** — when escalating to a human, pass a structured call summary so the customer doesn't repeat themselves. Have the agent generate a 2–3 sentence summary before transferring.

**Word Error Rate (WER)** — monitor transcription accuracy. Production call centres target below 5% WER. Custom vocabulary lists for product names and brand terminology cut errors significantly on domain-specific calls.

## The Human + AI Model

Voice AI handles Tier-1 volume: FAQs, order tracking, balance checks, appointment confirmations. Human agents handle complexity, escalations, and anything emotionally sensitive. The ratio varies, but most deployments see 50–70% of calls handled end-to-end by the AI, with the rest escalated.

This isn't a replacement play — it's a leverage play. The same team can handle more calls, and the calls they do handle are the ones worth their time.

---

## FAQ

**What is Voice AI in call centres?**
An automated conversation system that uses speech recognition, a language model, and text-to-speech to handle inbound calls in real time — without a human agent for routine requests.

**Can Voice AI replace human agents entirely?**
No. It automates high-volume, repeatable Tier-1 queries. Complex, sensitive, or nuanced conversations still need human judgment.

**How fast should the response be?**
Under 1 second for the complete STT → LLM → TTS cycle. Callers notice anything above that.

**What technologies power the stack?**
STT (Deepgram, AssemblyAI, Whisper), LLM (GPT-4o-mini, Claude), TTS (Cartesia, ElevenLabs), telephony (Twilio), real-time audio (LiveKit).

**What compliance considerations matter?**
PCI-DSS for payment data, GDPR for EU callers, HIPAA for healthcare. PII redaction in transcripts and secure call recording are non-negotiable in regulated industries.
