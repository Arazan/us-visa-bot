#!/usr/bin/env node

import { program } from 'commander';
import { botCommand } from './commands/bot.js';

program
  .name('us-visa-bot')
  .description('Automated US visa appointment rescheduling bot')
  .version('0.0.1');

program
  .command('bot')
  .description('Monitor and reschedule visa appointments')
  .requiredOption('-c, --current <date>', 'current booked date')
  .option('-t, --target <date>', 'target date to stop at')
  .option('-m, --min <date>', 'minimum date acceptable')
  .option('--dry-run', 'only log what would be booked without actually booking')
  .option('--max-loops <n>', 'maximum number of polling iterations before exiting', parseIntOpt)
  .option('--max-bookings <n>', 'maximum number of real bookings before exiting (dry-run bookings do not count)', parseIntOpt)
  .action(botCommand);

// Default command for backward compatibility
program
  .requiredOption('-c, --current <date>', 'current booked date')
  .option('-t, --target <date>', 'target date to stop at')
  .option('-m, --min <date>', 'minimum date acceptable')
  .option('--dry-run', 'only log what would be booked without actually booking')
  .option('--max-loops <n>', 'maximum number of polling iterations before exiting', parseIntOpt)
  .option('--max-bookings <n>', 'maximum number of real bookings before exiting (dry-run bookings do not count)', parseIntOpt)
  .action(botCommand);

program.parse();

function parseIntOpt(value) {
  const n = Number.parseInt(value, 10);
  if (!Number.isFinite(n) || n <= 0) {
    throw new Error(`Expected a positive integer, got "${value}"`);
  }
  return n;
}
