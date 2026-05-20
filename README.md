# US Visa Bot 🤖

An automated bot that monitors and reschedules US visa interview appointments to get you an earlier date.

## Features

- 🔄 Continuously monitors available appointment slots
- 📅 Automatically books earlier dates when found  
- 🎯 Configurable target and minimum date constraints
- 🚨 Exits successfully when target date is reached
- 📊 Detailed logging with timestamps
- 💬 Optional Discord webhook notifications on successful bookings and errors
- 🔐 Secure authentication with environment variables

## How It Works

The bot logs into your account on https://ais.usvisa-info.com/ and checks for available appointment dates every few seconds. When it finds a date earlier than your current booking (and within your specified constraints), it automatically reschedules your appointment.

## Prerequisites

- Node.js 16+ 
- A valid US visa interview appointment
- Access to https://ais.usvisa-info.com/

## Installation

1. Clone the repository:
```bash
git clone https://github.com/your-username/us-visa-bot.git
cd us-visa-bot
```

2. Install dependencies:
```bash
npm install
```

## Configuration

Create a `.env` file in the project root with your credentials and run parameters:

```env
# --- Credentials / target site ---
EMAIL=your.email@example.com
PASSWORD=your_password
COUNTRY_CODE=your_country_code
SCHEDULE_ID=your_schedule_id
FACILITY_ID=your_facility_id

# --- Polling cadence ---
# Randomized polling delay (seconds). A new value is picked each iteration.
REFRESH_DELAY_MIN=60
REFRESH_DELAY_MAX=120

# --- Run parameters (previously CLI flags) ---
CURRENT_DATE=2026-12-09     # REQUIRED, YYYY-MM-DD
#TARGET_DATE=2026-08-01     # optional, exit when an appt <= this is booked
#MIN_DATE=2026-05-01        # optional, ignore dates earlier than this
DRY_RUN=false               # true/1/yes/on => log only, do not book
#MAX_LOOPS=10               # optional, stop after N polling iterations
#MAX_BOOKINGS=1             # optional, stop after N real bookings

# --- Optional: mirror booking/error log messages to a Discord channel. ---
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/<id>/<token>
```

### Finding Your Configuration Values

| Variable | Description | How to Find |
|----------|-------------|-------------|
| `EMAIL` | Your login email | Your credentials for ais.usvisa-info.com |
| `PASSWORD` | Your login password | Your credentials for ais.usvisa-info.com |
| `COUNTRY_CODE` | Your country code | Found in URL: `https://ais.usvisa-info.com/en-{COUNTRY_CODE}/` <br>Examples: `br` (Brazil), `fr` (France), `de` (Germany) |
| `SCHEDULE_ID` | Your appointment schedule ID | Found in URL when rescheduling: <br>`https://ais.usvisa-info.com/en-{COUNTRY_CODE}/niv/schedule/{SCHEDULE_ID}/continue_actions` |
| `FACILITY_ID` | Your consulate facility ID | Found in network calls when selecting dates, or inspect the date selector dropdown <br>Example: Paris = `44` |
| `REFRESH_DELAY_MIN` | Minimum seconds between checks | Optional, defaults to `60`. A random delay is picked each iteration between MIN and MAX. |
| `REFRESH_DELAY_MAX` | Maximum seconds between checks | Optional, defaults to `120`. Must be `>= REFRESH_DELAY_MIN`. |
| `DISCORD_WEBHOOK_URL` | Discord webhook URL for booking and error notifications | Optional. When set, the bot posts a Discord message on successful bookings and on errors (socket hangups, session/auth failures). Leave unset to disable. |
| `CURRENT_DATE` | Your current booked interview date (YYYY-MM-DD) | **Required.** The bot only books dates earlier than this. |
| `TARGET_DATE` | Target date (YYYY-MM-DD) to stop at | Optional. The bot exits successfully once an appointment on or before this date is booked. |
| `MIN_DATE` | Minimum acceptable date (YYYY-MM-DD) | Optional. Skips any available date earlier than this. |
| `DRY_RUN` | Only log what would be booked without actually booking | Optional. Accepts `true`/`1`/`yes`/`on` (case-insensitive). Anything else is treated as false. Recommended for first runs. |
| `MAX_LOOPS` | Stop after this many polling iterations | Optional positive integer. If unset, the bot polls forever until stopped manually or a target/booking limit is reached. |
| `MAX_BOOKINGS` | Stop after this many real bookings | Optional positive integer. Dry-run bookings do **not** count. If unset, the bot keeps booking earlier dates indefinitely. |

### Discord Notifications (Optional)

To receive log messages in a Discord channel:

1. Open your Discord server and go to **Server Settings → Integrations → Webhooks**.
2. Click **New Webhook**, choose the target channel, and copy the **Webhook URL**.
3. Add it to your `.env` file:

   ```env
   DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/<id>/<token>
   ```

Only **actual bookings** and **errors** are posted to Discord (e.g. `✅ Booked appointment at 2026-07-15 09:00`, or `⚠️ Session/authentication error: ...`). Routine polling logs stay on the console only, so the channel doesn't get spammed. Dry-run "would book" events are not sent. Messages are delivered asynchronously and respect Discord's rate limits (HTTP 429 is handled automatically). If the variable is unset, Discord posting is silently disabled.

> ⚠️ Treat the webhook URL like a secret — anyone with it can post to your channel. Keep your `.env` out of version control.

## Usage

All run parameters now come from environment variables (see [Configuration](#configuration)). Fill in your `.env` and start the bot:

```bash
node src/index.js
```

Or via npm:

```bash
npm start
```

### Example `.env` recipes

**Dry run** — safely test login and polling without booking:
```env
CURRENT_DATE=2026-06-15
DRY_RUN=true
```

**With target date** — stop when you get June 1st or earlier:
```env
CURRENT_DATE=2026-06-15
TARGET_DATE=2026-06-01
```

**With minimum date** — only accept dates after May 1st:
```env
CURRENT_DATE=2026-06-15
MIN_DATE=2026-05-01
```

**Both constraints + a single booking cap:**
```env
CURRENT_DATE=2026-06-15
TARGET_DATE=2026-06-01
MIN_DATE=2026-05-01
MAX_BOOKINGS=1
```

**Cap polling iterations** (safety / testing):
```env
CURRENT_DATE=2026-06-15
MAX_LOOPS=10
```

## Running with Docker

The repo ships with a `Dockerfile` and a `docker-compose.yml` for running the bot in a container. All configuration — credentials *and* run parameters — is read from your `.env` file.

### Option A: Docker Compose (recommended)

1. Make sure your `.env` is filled in (see [Configuration](#configuration)), including `CURRENT_DATE` and any optional run parameters (`TARGET_DATE`, `MIN_DATE`, `DRY_RUN`, `MAX_LOOPS`, `MAX_BOOKINGS`).
2. Build and start:

   ```bash
   docker compose up --build -d
   ```

3. Tail the logs:

   ```bash
   docker compose logs -f
   ```

4. Stop:

   ```bash
   docker compose down
   ```

The service is configured with `restart: unless-stopped`, so the container will come back up after crashes or host reboots.

### Option B: Plain `docker run`

```bash
# Build the image
docker build -t us-visa-bot .

# Run it, passing your .env (which contains all run parameters)
docker run --rm --name us-visa-bot \
  --env-file .env \
  us-visa-bot
```

To run in the background with auto-restart, swap `--rm` for `-d --restart unless-stopped`.

### Notes

- The image is based on `node:20-alpine` and runs as the non-root `node` user.
- `.env` is **not** baked into the image — it's mounted at runtime via `--env-file` / `env_file:` so secrets stay out of the image layers.
- The bot doesn't expose any ports; no `-p` mapping is needed.

## How It Behaves

The bot will:
1. **Log in** to your account using provided credentials
2. **Check** for available dates on a randomized interval (between `REFRESH_DELAY_MIN` and `REFRESH_DELAY_MAX` seconds) to look less bot-like
3. **Compare** found dates against your constraints:
   - Must be earlier than `CURRENT_DATE`
   - Must be on or after `MIN_DATE` if specified
   - Will exit successfully if `TARGET_DATE` is reached
4. **Book** the appointment automatically if conditions are met (skipped when `DRY_RUN=true`)
5. **Continue** monitoring until target is reached or manually stopped

## Output Examples

```
[2026-05-20T18:36:28.060Z] Initializing with current date 2026-12-09
[2026-05-20T18:36:28.060Z] [DRY RUN MODE] Bot will only log what would be booked without actually booking
[2026-05-20T18:36:28.061Z] Initializing visa bot...
[2026-05-20T18:36:28.061Z] Logging in
[2026-05-20T18:36:28.978Z] no dates available
[2026-05-20T18:36:28.978Z] Sleeping for 101.7s before next check
[2026-05-20T18:38:10.700Z] found 1 good dates: 2026-07-15, using earliest: 2026-07-15
[2026-05-20T18:38:11.500Z] [DRY RUN] Would book appointment at 2026-07-15 09:00 (not actually booking)
```

## Safety Features

- ✅ **Read-only until booking** - Only books when better dates are found
- ✅ **Dry-run mode** - Set `DRY_RUN=true` to validate login and polling without booking
- ✅ **Loop & booking caps** - `MAX_LOOPS` and `MAX_BOOKINGS` provide hard exit limits
- ✅ **Randomized polling** - Random delay between checks to look less bot-like
- ✅ **Respects constraints** - Won't book outside your specified date range
- ✅ **Graceful exit** - Stops automatically when target is reached
- ✅ **Error recovery** - Automatically retries on network errors (1-hour cooldown on socket hangups)
- ✅ **Secure credentials** - Uses environment variables for sensitive data (`.env` is gitignored)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the ISC License.

## Disclaimer

This bot is for educational purposes. Use responsibly and in accordance with the terms of service of the visa appointment system. The authors are not responsible for any misuse or consequences.
