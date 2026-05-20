import { Bot } from '../lib/bot.js';
import { getConfig } from '../lib/config.js';
import { log, notify, sleep, randomDelay, isSocketHangupError } from '../lib/utils.js';

const COOLDOWN = 3600; // 1 hour in seconds

export async function botCommand(state = {}) {
  const config = getConfig();
  const bot = new Bot(config, { dryRun: config.dryRun });

  // `currentBookedDate` advances after each successful booking. Counters
  // persist across recursive auth-retry calls via `state`.
  let currentBookedDate = state.currentBookedDate ?? config.currentDate;
  let loopCount = state.loopCount ?? 0;
  let bookingCount = state.bookingCount ?? 0;

  const { targetDate, minDate, maxLoops, maxBookings } = config;

  log(`Initializing with current date ${currentBookedDate}`);

  if (config.dryRun) {
    log(`[DRY RUN MODE] Bot will only log what would be booked without actually booking`);
  }

  if (targetDate) {
    log(`Target date: ${targetDate}`);
  }

  if (minDate) {
    log(`Minimum date: ${minDate}`);
  }

  if (maxLoops) {
    log(`Max loops: ${maxLoops} (currently at ${loopCount})`);
  }

  if (maxBookings) {
    log(`Max real bookings: ${maxBookings} (currently at ${bookingCount})`);
  }

  try {
    const sessionHeaders = await bot.initialize();

    while (true) {
      if (maxLoops && loopCount >= maxLoops) {
        log(`Reached max loops (${maxLoops}). Exiting.`);
        process.exit(0);
      }

      loopCount++;
      log(`Loop ${loopCount}${maxLoops ? `/${maxLoops}` : ''}`);

      const availableDate = await bot.checkAvailableDate(
        sessionHeaders,
        currentBookedDate,
        minDate
      );

      if (availableDate) {
        const booked = await bot.bookAppointment(sessionHeaders, availableDate);

        if (booked) {
          // Update current date to the new available date
          currentBookedDate = availableDate;

          // Only real bookings count toward maxBookings.
          if (!config.dryRun) {
            bookingCount++;
            log(`Real bookings so far: ${bookingCount}${maxBookings ? `/${maxBookings}` : ''}`);
          }

          if (targetDate && availableDate <= targetDate) {
            log(`Target date reached! Successfully booked appointment on ${availableDate}`);
            process.exit(0);
          }

          if (maxBookings && bookingCount >= maxBookings) {
            log(`Reached max real bookings (${maxBookings}). Exiting.`);
            process.exit(0);
          }
        }
      }

      const delay = randomDelay(config.refreshDelayMin, config.refreshDelayMax);
      log(`Sleeping for ${delay.toFixed(1)}s before next check`);
      await sleep(delay);
    }
  } catch (err) {
    if (isSocketHangupError(err)) {
      notify(`⚠️ Socket hangup error: ${err.message}. Trying again after ${COOLDOWN} seconds...`);
      await sleep(COOLDOWN);
    } else {
      notify(`⚠️ Session/authentication error: ${err.message}. Retrying immediately...`);
    }
    return botCommand({ currentBookedDate, loopCount, bookingCount });
  }
}
