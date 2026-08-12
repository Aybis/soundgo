# MAYA Kids — Move. Play. Learn.

> **The camera is the sensor. The child's body is the controller.**

MAYA Kids is a **camera-native interactive learning platform** for children (~4–10). Instead of a normal educational website with a webcam bolted on, the camera, body movement, hands, face, gestures, voice, sound and character feedback *are* the interaction system. A child waves, points, pinches, squats, balances and traces in the air — and **MAYA** (the animated companion) responds, coaches and celebrates.

Built by evolving the open-source **Soundgo** camera-music prototype into a scalable **Motion Interaction Platform**.

---

## ✨ Try it in 30 seconds

```bash
npm install
npm run dev
```

Open `http://localhost:5173`, land on the MAYA home, and go into any game. **No camera needed to try it** — every game has a **Mock mode** (checkbox) that simulates hands/pose so you can play with a mouse right away.

| Game | What you do | Mock control |
|---|---|---|
| 🖐️ **Finger Math** | Show the right number of fingers | click a number 0–5 |
| ✋ **Grab the Answer** | Point & pinch the right answer | move mouse, click to select |
| 🤸 **Copy the Pose** | Copy MAYA's move and hold it | click a pose button |
| 🦵 **Squat Challenge** | Squat down & stand up to count reps | click ⬇ Squat / ⬆ Stand |
| 🦩 **Balance** | Stand on one leg like a flamingo | click One leg / Both feet |
| ✍️ **Air Writing** | Trace A-B-C / 1-2-3 in the air | click the trace button |
| 🎹 **Air Piano** | Move hand → play notes | move mouse across keys |
| 🥁 **Air Drums** | Swipe into invisible drums | swipe mouse into a drum |
| 👏 **Follow the Beat** | Clap on beats 1·2·4 | move mouse quickly to clap |

**AI layer** — `src/engine/ai/` is a provider-agnostic service (`AIService` interface + `ai()` singleton). Ships with an offline `MockAIService` (no network) that generates warm, context-aware encouragement, hints when a child is stuck, lesson tips, and adaptive difficulty suggestions. Swapping in a real LLM backend later is a one-class change — games never touch the provider.

---

## 🏗️ Architecture

The whole app is built on a strict **layered** separation (vision → motion → game → feedback → AI). Nothing mixes these responsibilities.

```
src/
├── app/                 # Pages & hubs (Home, Learn, Move)
├── activities/
│   ├── learn/           # finger-math, grab-answer
│   └── move/            # copy-pose, squat, balance
├── vision/              # Camera + inference (provider-agnostic)
│   ├── core/            # CameraManager, VisionEngine
│   ├── providers/       # MediaPipeVisionProvider, MockVisionProvider
│   ├── hands/           # finger counting, pinch
│   └── stabilization/   # TemporalSmoothing, HoldDetector, Debouncer
├── motion/              # Semantic events, interpreters, pose rules
│   ├── interpreters/    # HandInterpreter, PoseInterpreter (squat FSM)
│   ├── pointer/         # GesturePointer (index finger → cursor)
│   └── rules/           # PoseRuleEngine + joint angles
├── engine/              # GameSession, FeedbackManager, AudioEngine, VoiceService
├── character/           # MAYA (SVG renderer + state engine)
├── components/          # Character, Confetti, GestureCursor, InteractiveTarget
├── content/             # JSON-ish config-driven content per game
└── hooks/               # useVision, usePointerController, usePoseController
```

### The data flow

```
Camera → Vision(MediaPipe) → VisionFrame(normalized)
        → MotionInterpreter → MotionEvent (HAND_RAISED, FINGER_COUNT_CHANGED, SQUAT_COMPLETED…)
        → GameLogic (deterministic, no LLM)
        → Feedback (Character + Voice/TTS + Audio + Confetti)
```

**AI is deliberately kept OUT of the real-time loop.** It only generates structured content later (lessons, encouragement) — the deterministic game engine always executes it.

### Key design decisions

- **One camera lifecycle.** A single `CameraManager` owns the `getUserMedia` stream + mirroring + coordinate mapping. No component starts its own camera.
- **Provider-agnostic vision.** Games depend on a `VisionProvider` interface, never on MediaPipe. `MockVisionProvider` drives everything in tests/dev.
- **Per-activity model loading.** Each activity declares `visionRequirements` (e.g. Finger Math needs only `hands`; Squat needs only `pose`), so we never run every model at once.
- **Config-driven content.** Questions, poses, targets live in `src/content/` — games are generic engines over data.
- **Stabilization everywhere.** Finger count and holds are temporally smoothed so a single flickering frame never produces a wrong answer.

---

## 🛠️ Tech stack

- **React 19 + Vite 8 + TypeScript + Tailwind CSS v4**
- **@mediapipe/tasks-vision** — on-device hand/face/pose landmark inference (free, no API key, no frames leave the browser)
- **Web Audio API** — oscillator-based music + sound effects (volume groups: Master/Music/Effects/Voice)
- **Web Speech API** — MAYA's voice (provider-independent `VoiceService`)
- **react-router-dom** — routing
- **Vitest** — unit tests for the deterministic logic

Almost zero runtime dependencies — the browser does the heavy lifting.

---

## 🧪 Testing

```bash
npm test          # vitest (24 tests)
npm run build     # type-check + production build
```

Unit tests cover the deterministic, noise-sensitive logic: temporal stabilization, joint angles, semantic pose rules, finger counting, and the squat state machine (won't count a partial squat as a rep).

Since CV itself is hard to test with a real camera, `MockVisionProvider` simulates hands/pose so game logic can be verified headlessly.

---

## 🔒 Privacy

Designed for children, so by default:

- **All inference is local** in the browser. We never upload camera frames.
- No recording, no screenshots, no face identity recognition, no biometrics.
- No images are stored or sent to a backend.
- CV only produces **semantic events** (`FINGER_COUNT_CHANGED`, `SQUAT_COMPLETED`, …) — not imagery.

---

## 🗺️ Roadmap (phases)

| Phase | Status | Scope |
|---|---|---|
| 1. Foundation refactor | ✅ | CameraManager, VisionEngine, providers, VisionFrame, MotionEvent, stabilization, debug overlay |
| 2. MAYA shell | ✅ | Home, character engine, voice, feedback, game session |
| 3. Finger Math | ✅ | First end-to-end game — the reference implementation |
| 4. Generic pointer | ✅ | GesturePointer + Grab the Answer (5 subjects) |
| 5. Body engine | ✅ | Copy the Pose, Squat, Balance |
| 6. Creative | ✅ | Air Writing (finger trajectory trace, forgiving scoring) |
| 7. Music | ✅ | Air Piano, Air Drums, Follow the Beat (port Soundgo audio) |
| 8. AI (optional) | ✅ | AI service (provider-agnostic, offline MockAIService) — encouragement, hints, lessons, adaptive difficulty |

---

## 📁 Useful shortcuts

- `/lab` — vision debug harness (real + mock provider, FPS overlay, gesture/pose events)
- `/learn/finger-math`, `/learn/grab-answer` — Learn games
- `/move/copy-pose`, `/move/squat`, `/move/balance` — Move games
- `/create/air-writing` — Air Writing (trace letters/numbers)
- `/music` — the original Soundgo instrument

---

## 🙏 Credits

Built on the open-source **Soundgo** camera-interaction prototype (MediaPipe + Web Audio). MAYA Kids is its evolution into a full motion-interaction learning platform.