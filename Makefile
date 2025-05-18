.PHONY: all setup install-deps install-ffmpeg install-python-deps install-node-deps build-whisper dev stop clean download-model

# Variables
PYTHON_VENV = .venv
WHISPER_BUILD = backend/whisper.cpp/build
WHISPER_BIN = backend/whisper.cpp/build/bin/whisper-cli

# Default target
all: setup

# Setup everything
setup: install-deps build-whisper

# Install all dependencies
install-deps: install-ffmpeg install-python-deps install-node-deps

# Install ffmpeg based on OS
install-ffmpeg:
ifeq ($(shell uname), Darwin)
	@echo "Installing ffmpeg on macOS..."
	@which ffmpeg || (brew install ffmpeg)
else ifeq ($(shell uname), Linux)
	@echo "Installing ffmpeg on Linux..."
	@which ffmpeg || (sudo apt-get update && sudo apt-get install -y ffmpeg)
endif

# Install Python dependencies including WebSocket support
install-python-deps:
	@echo "Creating Python virtual environment..."
	@python3 -m venv $(PYTHON_VENV)
	@echo "Installing Python dependencies..."
	@. $(PYTHON_VENV)/bin/activate && pip3 install -r backend/requirements.txt
	@. $(PYTHON_VENV)/bin/activate && pip3 install "uvicorn[standard]" websockets python-multipart

# Install Node.js dependencies
install-node-deps:
	@echo "Installing Node.js dependencies..."
	@cd frontend && npm install
	@npm install

# Build whisper.cpp
build-whisper:
	@echo "Building whisper.cpp..."
	@cd backend/whisper.cpp && \
		cmake -S . -B build -DCMAKE_BUILD_TYPE=Release && \
		cmake --build build --config Release && \
		cd build && \
		make whisper-cli && \
		mkdir -p bin
	@if [ ! -f "$(WHISPER_BIN)" ]; then \
		echo "Error: whisper-cli binary not found at $(WHISPER_BIN)"; \
		exit 1; \
	fi

# Run development servers
dev: install-deps build-whisper download-model clean-ports
	@echo "Setting up development environment..."
	@echo "Starting development servers..."
	@echo "Starting backend server..."
	@bash -c 'source $(PYTHON_VENV)/bin/activate && cd backend && PYTHONPATH=. uvicorn main:app --reload --log-level debug --host 0.0.0.0 --port 8000' & echo $$! > .backend.pid
	@echo "Starting frontend server..."
	@cd frontend && NODE_ENV=development npm run dev & echo $$! > .frontend.pid

# Clean up ports
clean-ports:
	@echo "Cleaning up ports..."
	-@lsof -ti:8000 | xargs kill -9 2>/dev/null || true
	-@lsof -ti:5173 | xargs kill -9 2>/dev/null || true

# Stop development servers
stop:
	@echo "Stopping development servers..."
	@if [ -f "backend/.backend.pid" ]; then \
		kill -9 `cat backend/.backend.pid` 2>/dev/null || true; \
		rm backend/.backend.pid; \
	fi
	@if [ -f "frontend/.frontend.pid" ]; then \
		kill -9 `cat frontend/.frontend.pid` 2>/dev/null || true; \
		rm frontend/.frontend.pid; \
	fi
	@echo "Cleaning up any remaining processes..."
	-@lsof -ti:8000 | xargs kill -9 2>/dev/null || true
	-@lsof -ti:5173 | xargs kill -9 2>/dev/null || true

# Clean everything
clean: stop
	@echo "Cleaning up..."
	@rm -rf $(PYTHON_VENV)
	@rm -rf frontend/node_modules
	@rm -rf frontend/dist
	@rm -rf $(WHISPER_BUILD)
	@rm -rf backend/__pycache__
	@rm -rf backend/temp_*

# Download the Whisper model if it doesn't exist
download-model:
	@echo "Checking for Whisper model..."
	@if [ ! -f "backend/models/large-v3-turbo.bin" ]; then \
		echo "Downloading Whisper model..."; \
		mkdir -p backend/models; \
		curl -L https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-large-v3-turbo.bin?download=true \
			-o backend/models/large-v3-turbo.bin; \
	fi
