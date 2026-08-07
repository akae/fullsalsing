# 🌶️ Full Salsing Telegram Bot

A Telegram bot that manages news submissions for the Full Salsing tech gossip site.

## Features

- 📝 **News Submissions**: Users submit tech news
- 🤖 **AI Enhancement**: Claude AI rewrites submissions in the Full Salsing style
- ✅ **Admin Review**: Admin approves/rejects before posting
- 🔄 **GitHub Integration**: Approved news automatically updates the repo
- 🐳 **Docker Ready**: Containerized for easy deployment

## Setup

### 1. Get Credentials

**Telegram Bot Token:**
- Chat with [@BotFather](https://t.me/botfather) on Telegram
- Send `/newbot` and follow instructions
- Copy the token

**Get Your Chat ID:**
- Start the bot (even without full setup)
- Send any message
- Check logs for your chat ID, or use a temporary bot to get it

**GitHub Personal Access Token:**
- Go to GitHub Settings → Developer Settings → Personal Access Tokens → Tokens (classic)
- Generate new token with `repo` scope
- Copy the token

**Anthropic API Key:**
- Get your key from [Anthropic Console](https://console.anthropic.com/)

### 2. Configure Environment

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

Edit `.env`:
```
TELEGRAM_BOT_TOKEN=your_token_here
ADMIN_CHAT_ID=your_chat_id_here
GITHUB_TOKEN=your_github_token_here
GITHUB_REPO=your_username/fullsalsing
GITHUB_BRANCH=main
ANTHROPIC_API_KEY=your_anthropic_key_here
```

### 3. Run with Docker

**Build and run:**
```bash
docker-compose up -d
```

**View logs:**
```bash
docker-compose logs -f telegram-bot
```

**Stop:**
```bash
docker-compose down
```

### 4. Local Development (without Docker)

**Install dependencies:**
```bash
pip install -r requirements.txt
```

**Run bot:**
```bash
python bot.py
```

## Usage

### For Users

1. Start bot: `/start`
2. Submit news: `/submit`
3. Follow the format:
   ```
   Title: Your headline
   Content: Your story details
   Category: Tech (or Software, Programming, AI)
   ```
4. Bot will rewrite it with AI magic
5. Wait for admin approval

### For Admin

1. `/pending` - See all pending submissions
2. `/approve <id>` - Approve and post to GitHub
3. `/reject <id>` - Reject a submission

## How It Works

```
User submits news
    ↓
Claude AI rewrites it
    ↓
Bot stores pending submission
    ↓
Admin gets notification
    ↓
Admin approves via /approve
    ↓
Bot updates news-data.json in GitHub
    ↓
News appears on website
```

## Troubleshooting

**Bot not responding:**
- Check `.env` file has correct tokens
- Verify bot token is valid: `curl https://api.telegram.org/botYOUR_TOKEN/getMe`

**GitHub posting fails:**
- Verify GitHub token has `repo` permissions
- Check repo name format: `username/repository`
- Verify branch exists

**Claude rewriting fails:**
- Check ANTHROPIC_API_KEY is valid
- Check API quota/billing status

## Files

- `bot.py` - Main bot code
- `requirements.txt` - Python dependencies
- `Dockerfile` - Docker image definition
- `docker-compose.yml` - Docker Compose configuration
- `.env.example` - Environment variables template
- `pending_submissions.json` - Stored locally in `data/` directory

## Deployment Options

- **Railway.app**: Free tier with 5 GB memory
- **Render**: Free tier (sleeps after 15 min inactivity)
- **DigitalOcean**: $5/month droplet
- **Your own VPS**: Full control

## Security Notes

- Never commit `.env` file
- Use separate GitHub token for the bot (not personal)
- Rotate API keys regularly
- Only add trusted users as ADMIN_CHAT_ID
