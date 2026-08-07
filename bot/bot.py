#!/usr/bin/env python3
"""
Full Salsing Telegram Bot
Manages news submissions with AI rewriting and GitHub integration
"""

import json
import os
import logging
from datetime import datetime
from pathlib import Path
from dotenv import load_dotenv
from typing import Optional

from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import (
    Application,
    CommandHandler,
    MessageHandler,
    CallbackQueryHandler,
    ContextTypes,
    filters,
)
from telegram.error import TelegramError

from github import Github, GithubException
from anthropic import Anthropic

# Load environment variables
load_dotenv()

# Configuration
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
ADMIN_CHAT_ID = int(os.getenv("ADMIN_CHAT_ID", "0"))
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")
GITHUB_REPO = os.getenv("GITHUB_REPO", "username/fullsalsing")
GITHUB_BRANCH = os.getenv("GITHUB_BRANCH", "main")
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
SUBMISSIONS_FILE = os.getenv("SUBMISSIONS_FILE", "pending_submissions.json")

# Setup logging
logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    level=logging.INFO,
)
logger = logging.getLogger(__name__)

# Initialize clients
github_client = Github(GITHUB_TOKEN)
anthropic_client = Anthropic()

# Submission storage
SUBMISSIONS_PATH = Path(SUBMISSIONS_FILE)


def load_submissions():
    """Load pending submissions from file"""
    if SUBMISSIONS_PATH.exists():
        with open(SUBMISSIONS_PATH, "r") as f:
            return json.load(f)
    return {}


def save_submissions(submissions):
    """Save pending submissions to file"""
    with open(SUBMISSIONS_PATH, "w") as f:
        json.dump(submissions, f, indent=2)


async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Start command"""
    user_id = update.effective_user.id
    logger.info(f"User started bot. Chat ID: {user_id}")

    await update.message.reply_text(
        f"""🌶️ Welcome to Full Salsing News Bot!

Submit your spicy tech news and I'll enhance it with AI magic.

*Your Chat ID: `{user_id}`* (for admins)

Commands:
/submit - Submit a news story
/help - Show help
/pending - List pending submissions (admin only)
/approve - Approve a submission (admin only)
/reject - Reject a submission (admin only)
        """,
        parse_mode="Markdown",
    )


async def submit_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Start news submission process"""
    await update.message.reply_text(
        """📝 Let's submit some spicy tech news!

Please provide:
1. **Title** (what's the headline?)
2. **Topic/Content** (what's the story?)
3. **Category** (Tech, Software, Programming, AI, or other)

Send them in this format:
```
Title: Your headline here
Content: Your story here
Category: Tech
```

Or just reply with the title and I'll ask for details."""
    )
    context.user_data["submitting"] = True


async def handle_submission(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle news submission"""
    if not context.user_data.get("submitting"):
        return

    text = update.message.text
    user = update.effective_user

    try:
        # Parse submission
        lines = text.strip().split("\n")
        submission_data = {}

        for line in lines:
            if ":" in line:
                key, value = line.split(":", 1)
                submission_data[key.strip().lower()] = value.strip()

        title = submission_data.get("title", "")
        content = submission_data.get("content", "")
        category = submission_data.get("category", "Tech")

        if not title or not content:
            await update.message.reply_text(
                "❌ Please provide both title and content. Try again:"
            )
            return

        await update.message.reply_text(
            "⏳ Rewriting your news with AI magic... (this may take a moment)"
        )

        # Use Claude to rewrite the news
        rewritten = rewrite_news_with_claude(title, content, category)

        submission_id = datetime.now().isoformat()
        submissions = load_submissions()

        submissions[submission_id] = {
            "user_id": user.id,
            "username": user.username or user.first_name,
            "original_title": title,
            "original_content": content,
            "rewritten_title": rewritten["title"],
            "rewritten_content": rewritten["content"],
            "category": rewritten["category"],
            "size": "medium",  # Default size
            "timestamp": datetime.now().isoformat(),
            "status": "pending",
        }

        save_submissions(submissions)

        # Show preview to user
        preview_text = f"""✨ Here's your AI-enhanced news:

**Title:** {rewritten['title']}

**Content:** {rewritten['content']}

**Category:** {rewritten['category']}

Submitted for admin review!"""

        await update.message.reply_text(preview_text)
        context.user_data["submitting"] = False

        # Notify admin
        if ADMIN_CHAT_ID:
            await context.bot.send_message(
                ADMIN_CHAT_ID,
                f"""📨 New submission from @{user.username or user.first_name}:

**Original Title:** {title}

**Rewritten Title:** {rewritten['title']}

**Content:** {rewritten['content']}

ID: `{submission_id}`""",
                parse_mode="Markdown",
            )

    except Exception as e:
        logger.error(f"Error processing submission: {e}")
        await update.message.reply_text(f"❌ Error processing submission: {str(e)}")
        context.user_data["submitting"] = False


def rewrite_news_with_claude(title: str, content: str, category: str) -> dict:
    """Use Claude to rewrite and enhance news"""
    prompt = f"""You are the editor of FULL SALSING - a sensationalist tech news site with a spicy, gossipy tone.
    
Rewrite the following tech news in our style - make it more dramatic, gossip-like, and add tech industry humor.
Keep it between 1-3 sentences. Add relevant emojis.

Original Title: {title}
Original Content: {content}
Category: {category}

Respond in JSON format:
{{
    "title": "rewritten title with emoji",
    "content": "rewritten content 1-3 sentences",
    "category": "{category}"
}}"""

    message = anthropic_client.messages.create(
        model="claude-3-5-sonnet-20241022",
        max_tokens=500,
        messages=[{"role": "user", "content": prompt}],
    )

    response_text = message.content[0].text

    # Parse JSON from response
    try:
        json_start = response_text.find("{")
        json_end = response_text.rfind("}") + 1
        json_str = response_text[json_start:json_end]
        result = json.loads(json_str)
        return result
    except (json.JSONDecodeError, ValueError):
        # Fallback if parsing fails
        return {
            "title": f"🌶️ {title}",
            "content": content,
            "category": category,
        }


async def pending_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Show pending submissions (admin only)"""
    if update.effective_user.id != ADMIN_CHAT_ID:
        await update.message.reply_text("❌ Admin only command")
        return

    submissions = load_submissions()
    pending = {k: v for k, v in submissions.items() if v["status"] == "pending"}

    if not pending:
        await update.message.reply_text("✅ No pending submissions!")
        return

    message = "📋 **Pending Submissions:**\n\n"
    for sub_id, sub in pending.items():
        message += f"""**From:** @{sub['username']}
**Title:** {sub['rewritten_title']}
**Content:** {sub['rewritten_content']}
**Category:** {sub['category']}
**ID:** `{sub_id}`

"""

    await update.message.reply_text(message, parse_mode="Markdown")


async def approve_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Approve a submission and post to repo"""
    if update.effective_user.id != ADMIN_CHAT_ID:
        await update.message.reply_text("❌ Admin only command")
        return

    if not context.args:
        await update.message.reply_text(
            "Usage: /approve <submission_id>\n\nGet ID from /pending"
        )
        return

    submission_id = context.args[0]
    submissions = load_submissions()

    if submission_id not in submissions:
        await update.message.reply_text(f"❌ Submission not found: {submission_id}")
        return

    submission = submissions[submission_id]

    if submission["status"] != "pending":
        await update.message.reply_text(
            f"❌ Submission already {submission['status']}"
        )
        return

    try:
        await update.message.reply_text("⏳ Posting to GitHub...")

        # Post to GitHub
        success = post_to_github(submission)

        if success:
            submission["status"] = "approved"
            save_submissions(submissions)

            await update.message.reply_text(
                f"""✅ Approved and posted!

**Title:** {submission['rewritten_title']}
**Content:** {submission['rewritten_content']}"""
            )
        else:
            await update.message.reply_text("❌ Failed to post to GitHub")

    except Exception as e:
        logger.error(f"Error approving submission: {e}")
        await update.message.reply_text(f"❌ Error: {str(e)}")


async def reject_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Reject a submission"""
    if update.effective_user.id != ADMIN_CHAT_ID:
        await update.message.reply_text("❌ Admin only command")
        return

    if not context.args:
        await update.message.reply_text(
            "Usage: /reject <submission_id>\n\nGet ID from /pending"
        )
        return

    submission_id = context.args[0]
    submissions = load_submissions()

    if submission_id not in submissions:
        await update.message.reply_text(f"❌ Submission not found: {submission_id}")
        return

    submission = submissions[submission_id]
    submission["status"] = "rejected"
    save_submissions(submissions)

    await update.message.reply_text(f"❌ Rejected submission: {submission_id}")


def post_to_github(submission: dict) -> bool:
    """Post approved submission to news-data.json on GitHub"""
    try:
        repo = github_client.get_repo(GITHUB_REPO)
        main_branch = repo.get_branch(GITHUB_BRANCH)

        # Get current news-data.json
        try:
            file_content = repo.get_contents("news-data.json", ref=GITHUB_BRANCH)
            news_data = json.loads(file_content.decoded_content.decode())
        except GithubException:
            news_data = {"news": []}

        # Get highest ID
        max_id = max((item.get("id", 0) for item in news_data.get("news", [])), default=0)

        # Create new news item
        new_item = {
            "id": max_id + 1,
            "title": submission["rewritten_title"],
            "content": submission["rewritten_content"],
            "category": submission["category"],
            "size": submission["size"],
        }

        # Add to beginning of list
        news_data["news"].insert(0, new_item)

        # Commit to GitHub
        repo.update_file(
            "news-data.json",
            f"Add news: {submission['rewritten_title']}",
            json.dumps(news_data, indent=2),
            file_content.sha,
            branch=GITHUB_BRANCH,
        )

        logger.info(f"Posted to GitHub: {submission['rewritten_title']}")
        return True

    except Exception as e:
        logger.error(f"GitHub posting error: {e}")
        return False


async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Show help"""
    await update.message.reply_text(
        """🌶️ **Full Salsing Bot Help**

**User Commands:**
/submit - Submit a news story (will be AI-enhanced and sent for review)
/help - Show this message

**Admin Commands:**
/pending - List all pending submissions
/approve <id> - Approve and post a submission
/reject <id> - Reject a submission

**How it works:**
1. Users submit news via /submit
2. AI rewrites the news in FULL SALSING style
3. Admin reviews and approves
4. Approved news is posted to the website via GitHub""",
        parse_mode="Markdown",
    )


async def error_handler(update: object, context: ContextTypes.DEFAULT_TYPE):
    """Log errors"""
    logger.error(f"Update {update} caused error {context.error}")


def main():
    """Start the bot"""
    if not TELEGRAM_BOT_TOKEN:
        raise ValueError("TELEGRAM_BOT_TOKEN not set in .env")
    if not ADMIN_CHAT_ID or ADMIN_CHAT_ID == 0:
        raise ValueError("ADMIN_CHAT_ID not set in .env")
    if not GITHUB_TOKEN:
        raise ValueError("GITHUB_TOKEN not set in .env")
    if not ANTHROPIC_API_KEY:
        raise ValueError("ANTHROPIC_API_KEY not set in .env")

    app = Application.builder().token(TELEGRAM_BOT_TOKEN).build()

    # Commands
    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("help", help_command))
    app.add_handler(CommandHandler("submit", submit_command))
    app.add_handler(CommandHandler("pending", pending_command))
    app.add_handler(CommandHandler("approve", approve_command))
    app.add_handler(CommandHandler("reject", reject_command))

    # Message handler for submissions
    app.add_handler(
        MessageHandler(filters.TEXT & ~filters.COMMAND, handle_submission)
    )

    # Error handler
    app.add_error_handler(error_handler)

    logger.info("🤖 Full Salsing Bot started!")
    app.run_polling(allowed_updates=Update.ALL_TYPES)


if __name__ == "__main__":
    main()
