# StudyFlow - AI-Powered Transcription for Students

## Table of Contents
1. [Overview](#overview)
2. [Features](#features)
3. [Getting Started](#getting-started)
4. [Model Setup](#model-setup)
5. [Installation](#installation)
6. [Usage](#usage)
7. [Contributing](#contributing)
8. [License](#license)

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

### 2. Install Python Dependencies (Backend)
1. Create a virtual environment (optional but recommended):
   ```bash
   python3 -m venv .venv
   source .venv/bin/activate  # On macOS/Linux
   # or .venv\Scripts\activate on Windows
   ```
2. Install the backend requirements:
   ```bash
   cd backend
   pip install -r requirements.txt
   ```
3. [Optional] Compile Whisper.cpp for your machine (if not already compiled). For example:
   ```bash
   cd whisper.cpp
   # Use a script like compile_whisper.sh or build commands
   ./compile_whisper.sh
   # or
   cmake -B build
   cmake --build build --config Release
   ```

### 3. Install Node.js Dependencies (Frontend)
In another terminal (or after finishing the backend steps):
```bash
cd ../frontend
npm install
```
> This installs React, Tailwind CSS, Axios, and other frontend dependencies.

---

## Usage

### 1. Run Both Servers with One Command (Optional)
If you have a `package.json` in the project root with `concurrently`, you can launch both servers at once:
```bash
npm run dev
```
This will:
- Start the FastAPI backend on [http://localhost:8000](http://localhost:8000)  
- Start the React frontend on [http://localhost:3000](http://localhost:3000)

### 2. Run Backend and Frontend Separately
- **Backend**:
  ```bash
  cd backend
  uvicorn main:app --host 0.0.0.0 --port 8000 --reload
  ```
- **Frontend**:
  ```bash
  cd frontend
  npm start
  ```

### 3. Uploading Audio & Summarizing
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