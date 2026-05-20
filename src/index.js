#!/usr/bin/env node

import { botCommand } from './commands/bot.js';

// All run parameters now come from environment variables (see .env / README).
botCommand();
