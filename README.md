# NeuroSonic 🦻🔊

**NeuroSonic** is a hearing loss and tinnitus experience simulator and therapy application. It is designed to bridge the gap between people experiencing tinnitus or hearing loss and those around them, allowing anyone to hear and understand exactly what you hear.

---

## 🌟 Key Features

- **Tinnitus & Hearing Loss Simulator:**
  - Independent Left / Right ear frequency generators (up to high-pitched tinnitus ranges).
  - Fine-grained decibel volume matching and channel linking.
  - Phase inversion toggles for spatial cancelation and psychoacoustic testing.
  - Multiple waveform selections: Sine, Square, Sawtooth, and Triangle waves.
- **Sound Therapy & Masking:**
  - Acoustic masking profiles and sound therapy generation to help soothe tinnitus distress.
  - Custom tone layering and frequency filtering.
- **AI Recommendation Engine:**
  - Powered by **Google Genkit** and **Gemini**.
  - Analyzes user descriptions of their tinnitus symptoms and provides customized sound therapy suggestions and acoustic recommendations.
- **Cloud Profile Archiving & Sync:**
  - Firebase Authentication for account management.
  - Cloud Firestore integration to save, archive, and retrieve custom hearing and tinnitus profiles across sessions.

---

## 🛠️ Technology Stack

- **Framework:** [Next.js 15](https://nextjs.org/) (App Router & Turbopack)
- **UI & Components:** [React 19](https://react.dev/), [Tailwind CSS](https://tailwindcss.com/), Radix UI, Lucide Icons
- **Audio Engine:** Web Audio API with custom synthesizer hooks
- **Backend & Database:** Google Cloud Firestore & Firebase Auth
- **AI & LLM Workflows:** Google Genkit (`@genkit-ai/google-genai`) & Gemini
- **Language:** TypeScript

---

## 🚀 Getting Started

### 1. Prerequisites

- [Node.js](https://nodejs.org/) (v20 or v22 recommended)
- `npm` or `pnpm`

### 2. Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/Allthejam/Neurosonic.git
cd Neurosonic
npm install
```

### 3. Environment Variables

Create a `.env` file in the root directory based on `.env.example`:

```bash
cp .env.example .env
```

Fill in your API keys and Firebase credentials:
- `GEMINI_API_KEY`: Your Google AI Gemini API key.
- `NEXT_PUBLIC_FIREBASE_*`: Your Firebase project credentials for Authentication and Firestore.

### 4. Running the Development Server

Start the local Next.js server:

```bash
npm run dev
```

Open [http://localhost:9002](http://localhost:9002) in your browser.

---

## 🧪 AI Flows with Genkit

To test and develop Genkit AI flows locally with the Genkit Developer UI:

```bash
npm run genkit:dev
```

---

## 📄 License

MIT License. See [LICENSE](LICENSE) for details.
