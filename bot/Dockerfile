FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy bot code
COPY bot.py .

# Create directory for submissions storage
RUN mkdir -p /app/data

# Set environment variable to store submissions in data directory
ENV SUBMISSIONS_FILE=/app/data/pending_submissions.json

# Run bot
CMD ["python", "bot.py"]
