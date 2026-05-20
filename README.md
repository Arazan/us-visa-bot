# US Visa Bot 🤖

An automated bot that monitors and reschedules US visa interview appointments to get you an earlier date.

## Features

- 🔄 Continuously monitors available appointment slots
- 📅 Automatically books earlier dates when found  
- 🎯 Configurable target and minimum date constraints
- 🚨 Exits successfully when target date is reached
- 📊 Detailed logging with timestamps
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

Create a `.env` file in the project root with your credentials:

```env
EMAIL=your.email@example.com
PASSWORD=your_password
COUNTRY_CODE=your_country_code
SCHEDULE_ID=your_schedule_id
FACILITY_ID=your_facility_id

# Randomized polling delay (seconds). A new value is picked each iteration.
REFRESH_DELAY_MIN=60
REFRESH_DELAY_MAX=120
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

## Usage

Run the bot with your current appointment date:

```bash
node src/index.js -c <current_date> [-t <target_date>] [-m <min_date>] [--dry-run]
```

Or via npm:

```bash
npm start -- -c <current_date> [-t <target_date>] [-m <min_date>] [--dry-run]
```

### Command Line Arguments

| Flag | Long Form | Required | Description |
|------|-----------|----------|-------------|
| `-c` | `--current` | ✅ | Your current booked interview date (YYYY-MM-DD) |
| `-t` | `--target` | ❌ | Target date to stop at - exits successfully when reached |
| `-m` | `--min` | ❌ | Minimum acceptable date - skips dates before this |
|      | `--dry-run` | ❌ | Log what would be booked without actually booking (recommended for first run) |

### Examples

```bash
# Basic usage - reschedule to any earlier date
node src/index.js -c 2026-06-15

# Dry run - safely test login and polling without booking
node src/index.js -c 2026-06-15 --dry-run

# With target date - stop when you get June 1st or earlier
node src/index.js -c 2026-06-15 -t 2026-06-01

# With minimum date - only accept dates after May 1st
node src/index.js -c 2026-06-15 -m 2026-05-01

# With both constraints - only book between May 1st and June 1st
node src/index.js -c 2026-06-15 -t 2026-06-01 -m 2026-05-01

# Get help
node src/index.js --help
```

## How It Behaves

The bot will:
1. **Log in** to your account using provided credentials
2. **Check** for available dates on a randomized interval (between `REFRESH_DELAY_MIN` and `REFRESH_DELAY_MAX` seconds) to look less bot-like
3. **Compare** found dates against your constraints:
   - Must be earlier than current date (`-c`)
   - Must be after minimum date (`-m`) if specified
   - Will exit successfully if target date (`-t`) is reached
4. **Book** the appointment automatically if conditions are met (skipped when `--dry-run` is set)
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
- ✅ **Dry-run mode** - Use `--dry-run` to validate login and polling without booking
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
