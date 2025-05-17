# StudyFlow - AI-Powered Transcription for Students

## Table of Contents
1. [Overview](#overview)
2. [Features](#features)
3. [Deployment](#deployment)
4. [Getting Started](#getting-started)
5. [Model Setup](#model-setup)
6. [Installation](#installation)
7. [Usage](#usage)
8. [Contributing](#contributing)
9. [License](#license)

---

## Overview
**StudyFlow** is an open-source, AI-powered transcription and summarization tool designed for students worldwide. It helps convert lectures, discussions, and interviews into structured, searchable, and summarized notes.

## Features
- **Super-Fast Transcription** (Parallel Whisper.cpp processing)  
- **AI Summarization** (Concise study notes via LLMs)  
- **Optimized Backend** (Python, FastAPI, GPU-accelerated processing)  
- **Modern UI** (React.js & Tailwind CSS for seamless UX)  
- **Secure & Private** (GDPR-compliant, encrypted data handling)  
- **Open-Source & Community-Driven** (Built by students, for students)

## Deployment

The frontend is deployed to GitHub Pages and can be accessed at: https://amakran2003.github.io/StudyFlow

### To Deploy

There are two ways to deploy updates:

1. **Automatic Deployment**
   - Push your changes to the main branch
   - GitHub Actions will automatically build and deploy to GitHub Pages

2. **Manual Deployment**
   ```bash
   cd frontend
   npm run deploy
   ```

This will:
1. Build your project with the correct base URL for GitHub Pages
2. Deploy it to the gh-pages branch
3. Make it available at https://amakran2003.github.io/StudyFlow

### Note about Routing

The application uses HashRouter for client-side routing to work properly with GitHub Pages. This means URLs will look like:

- Home: https://amakran2003.github.io/StudyFlow/#/
- Transcribe: https://amakran2003.github.io/StudyFlow/#/transcribe
- About: https://amakran2003.github.io/StudyFlow/#/about

---

## Getting Started

To run StudyFlow, you’ll need:

- **Python** 3.9+  
- **Node.js** (v16 or later recommended)  
- **Whisper.cpp** compiled for your machine  
- An **OpenAI API key** (if using GPT-based summarization)

---

## Model Setup

### 1. Download the Whisper Model
StudyFlow relies on [Whisper.cpp](https://github.com/ggerganov/whisper.cpp) for transcription. You’ll need to download a Whisper model (e.g., `large-v3-turbo.bin` or another `.bin` model). 

1. Go to the [whisper.cpp models page](https://github.com/ggerganov/whisper.cpp#ggml-format) or a similar source.
2. Download the desired model (e.g., `large-v3-turbo.bin`).

### 2. Store the Model
Place the downloaded model file in the following directory:
```
backend/models/large-v3-turbo.bin
```
> **Note:** Ensure the file name matches what your code expects (e.g., `large-v3-turbo.bin`). If you change the name, also update the path in your code (typically in `audio_processor.py`).

---

## Installation

### 1. Clone the Repository
```bash
git clone https://github.com/Amakran2003/StudyFlow
cd StudyFlow
```

## Usage

### 1. Run make
```bash
make dev
```
This will:
- Install all dependencies
- Start the FastAPI backend on [http://localhost:8000](http://localhost:8000)  
- Start the React frontend on [http://localhost:3000](http://localhost:3000)

### 2. Uploading Audio & Summarizing
Open your browser at [http://localhost:3000](http://localhost:3000):
1. Select an audio file (WAV, MP3, etc.).
2. Click **“Upload & Transcribe”**.
3. StudyFlow will process the file with Whisper.cpp and summarize it via GPT-based LLM (if configured).

---

## Contributing
We welcome contributions from the community. Please see our [CONTRIBUTING.md](./CONTRIBUTING.md) for details on how to get started.

---

## License
This project is licensed under the [MIT License](./LICENSE). By contributing to this project, you agree that your contributions will be licensed under its MIT license.

---

> **Note**: You can adapt these instructions to reflect any custom file names, directories, or build processes you’ve defined in your code.