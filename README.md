# InteractGen-VoiceTourGuide

# NaviBot - AI Voice Tour Guide 🤖✨

**NaviBot** (formerly InteractGen) is an intelligent Chrome Extension that transforms any static webpage into an interactive, voice-guided tour. Powered by Google Gemini and a robust React frontend, it acts as your personal digital guide, reading content aloud, scrolling through sections, and answering questions about the page in real-time.

## 🚀 Features

- **🎙️ Voice-Guided Tours**: Automatically scans the page DOM, generates a logical tour flow, and reads content aloud using Text-to-Speech.
- **📜 Smart Auto-Scrolling**: seamless navigation that scrolls to the specific element being discussed.
- **💬 Interactive Chat**: Ask questions about the page content using your voice or text, powered by AI.
- **🔐 User Authentication**: Secure Sign In and Sign Up using Firebase Auth.
- **👤 User Profile**: Manage your session and log out easily with a dedicated profile view.
- **✨ Modern UI**: A polished, floating interface with glassmorphism effects, smooth animations (Framer Motion), and a responsive design.
- **🖱️ Click Safety**: Intercepts automated clicks on interactive elements to prevent unwanted navigation without user confirmation.

## 🛠️ Tech Stack

### Frontend (Chrome Extension)
- **Framework**: React 18
- **Build Tool**: Vite
- **Language**: TypeScript
- **Styling**: Inline Styles / CSS Modules (for isolation in Shadow DOM)
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Authentication**: Firebase Auth (v9 Modular SDK)
- **Browser APIs**: Chrome Extension API (Tabs, Runtime, Scripting)

### Backend (API)
- **Framework**: FastAPI (Python)
- **AI Model**: Google Gemini Pro (via LangChain Google GenAI)
- **Orchestration**: LangChain
- **Validation**: Pydantic
- **Environment**: Python 3.9+

## 🏗️ Architecture & Workflow

1.  **Page Analysis (Content Script)**:
    - When verified, the extension injects a Shadow DOM into the current webpage.
    - `domScanner.ts` intelligently scrapes visible text, headers, and interactive elements, filtering out noise.

2.  **Tour Generation (Backend)**:
    - The scanned DOM structure is sent to the FastAPI backend.
    - LangChain prompts Gemini to create a "Tour Script"—a structured JSON list of steps containing selectors, narratives, and actions (scroll/click).

3.  **Execution Engine (Frontend)**:
    - The extension receives the tour plan.
    - It iterates through steps: locating the element in the DOM, scrolling it into view, highlighting it, and using `window.speechSynthesis` to speak the narrative.

4.  **Interaction**:
    - Users can pause, skip, or stop the tour.
    - Users can toggle the microphone to ask specific questions ("What is the pricing?"), which are processed by a separate RAG-like chain in the backend.

## 📦 Installation & Setup

### Prerequisites
- Node.js & npm
- Python 3.9+
- Google Gemini API Key
- Firebase Project Config

### 1. Backend Setup
```bash
cd backend
# Create virtual environment
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows

# Install dependencies
pip install -r requirements.txt

# Configure Environment
# Create a .env file and add your Google API Key:
# GOOGLE_API_KEY=your_key_here

# Run Server
python main.py
```

### 2. Extension Setup
```bash
cd extension

# Install dependencies
npm install

# Configure Firebase
# Update src/firebaseConfig.ts with your Firebase project details

# Build Extension
npm run build
```

### 3. Load into Chrome
1.  Open Chrome and navigate to `chrome://extensions`.
2.  Enable **Developer Mode** (top right).
3.  Click **Load unpacked**.
4.  Select the `extension/dist` folder.
5.  Pin NaviBot to your toolbar!

## 🤝 Contributing
Feel free to open issues or submit pull requests.

## 📄 License
MIT
