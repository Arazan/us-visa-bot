import { Bot } from '../lib/bot.js';
import { getConfig } from '../lib/config.js';
import { log, notify, sleep, randomDelay, isSocketHangupError } from '../lib/utils.js';

const COOLDOWN = 3600; // 1 hour in seconds

export async function botCommand(options) {
  const config = getConfig();
  const bot = new Bot(config, { dryRun: options.dryRun });
  let currentBookedDate = options.current;
  const targetDate = options.target;
  const minDate = options.min;
  const maxLoops = options.maxLoops;
  const maxBookings = options.maxBookings;

  // Counters persist across auth-retry recursion via the options object.
  let loopCount = options._loopCount ?? 0;
  let bookingCount = options._bookingCount ?? 0;

  log(`Initializing with current date ${currentBookedDate}`);

  if (options.dryRun) {
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
          if (!options.dryRun) {
            bookingCount++;
            log(`Real bookings so far: ${bookingCount}${maxBookings ? `/${maxBookings}` : ''}`);
          }

          options = {
            ...options,
            current: currentBookedDate,
            _loopCount: loopCount,
            _bookingCount: bookingCount
          };

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
    return botCommand({
      ...options,
      _loopCount: loopCount,
      _bookingCount: bookingCount
    });
  }
}
