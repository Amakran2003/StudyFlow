.PHONY: all setup install-deps install-ffmpeg install-python-deps install-node-deps build-whisper download-model clean run dev

# Default target
all: setup run

# Setup everything
setup: install-deps build-whisper download-model

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

# Install Python dependencies
install-python-deps:
	@echo "Creating Python virtual environment..."
	@python3 -m venv .venv
	@echo "Activating virtual environment and installing Python dependencies..."
	@. .venv/bin/activate && pip3 install -r backend/requirements.txt

# Install Node.js dependencies
install-node-deps:
	@echo "Installing Node.js dependencies..."
	@npm install
	@cd frontend && npm install

# Build whisper.cpp
build-whisper:
	@echo "Building whisper.cpp..."
	@cd backend/whisper.cpp && cmake -B build && cmake --build build

# Download the Whisper model if it doesn't exist
download-model:
	@echo "Checking for Whisper model..."
	@if [ ! -f "backend/models/large-v3-turbo.bin" ]; then \
		echo "Downloading Whisper model..."; \
		mkdir -p backend/models; \
		curl -L https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-large-v3-turbo.bin?download=true \
			-o backend/models/large-v3-turbo.bin; \
	fi

# Clean up
clean:
	@echo "Cleaning up..."
	@rm -rf backend/__pycache__
	@rm -rf backend/temp_*
	@rm -rf .venv
	@rm -rf node_modules
	@rm -rf frontend/node_modules
	@rm -rf backend/whisper.cpp/build

# Run the development servers
run:
	@echo "Starting development servers..."
	@if [ -f ".venv/bin/activate" ]; then \
		. .venv/bin/activate && npm run dev; \
	else \
		npm run dev; \
	fi

# Install all node dependencies
setup-node:
	@echo "Installing Node.js dependencies..."
	@npm run setup

# Development mode (setup + run)
dev: setup-node run
