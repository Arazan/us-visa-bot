import { VisaHttpClient } from './client.js';
import { log, notify } from './utils.js';

export class Bot {
  constructor(config, options = {}) {
    this.config = config;
    this.dryRun = options.dryRun || false;
    this.client = new VisaHttpClient(this.config.countryCode, this.config.email, this.config.password);
  }

  async initialize() {
    log('Initializing visa bot...');
    return await this.client.login();
  }

  async checkAvailableDate(sessionHeaders, currentBookedDate, minDate) {
    const dates = await this.client.checkAvailableDate(
      sessionHeaders,
      this.config.scheduleId,
      this.config.facilityId
    );

    if (!dates || dates.length === 0) {
      log("no dates available");
      return null;
    }

    // Filter dates that are better than current booked date and after minimum date
    const goodDates = dates.filter(date => {
      if (date >= currentBookedDate) {
        log(`date ${date} is further than already booked (${currentBookedDate})`);
        return false;
      }

      if (minDate && date < minDate) {
        log(`date ${date} is before minimum date (${minDate})`);
        return false;
      }

      return true;
    });

    if (goodDates.length === 0) {
      log("no good dates found after filtering");
      return null;
    }

    // Sort dates and return the earliest one
    goodDates.sort();
    const earliestDate = goodDates[0];
    
    log(`found ${goodDates.length} good dates: ${goodDates.join(', ')}, using earliest: ${earliestDate}`);
    return earliestDate;
  }

  async bookAppointment(sessionHeaders, date) {
    const time = await this.client.checkAvailableTime(
      sessionHeaders,
      this.config.scheduleId,
      this.config.facilityId,
      date
    );

    if (!time) {
      log(`no available time slots for date ${date}`);
      return false;
    }

    if (this.dryRun) {
      log(`[DRY RUN] Would book appointment at ${date} ${time} (not actually booking)`);
      return true;
    }

    const result = await this.client.book(
      sessionHeaders,
      this.config.scheduleId,
      this.config.facilityId,
      date,
      time
    );

    const fullDetails =
      `Booking request: ${result.request.method} ${result.request.url}\n` +
      `Body: ${JSON.stringify(result.request.body)}\n` +
      `Response: ${result.response.status} ${result.response.statusText} (final URL: ${result.response.url})\n` +
      `Response body:\n${result.response.body}`;

    // Truncate response body for Discord — booking pages return full HTML.
    const RESPONSE_BODY_MAX = 1500;
    const truncatedBody = result.response.body.length > RESPONSE_BODY_MAX
      ? result.response.body.slice(0, RESPONSE_BODY_MAX) + `... [truncated, total ${result.response.body.length} chars]`
      : result.response.body;
    const discordDetails =
      `Booking request: ${result.request.method} ${result.request.url}\n` +
      `Body: ${JSON.stringify(result.request.body)}\n` +
      `Response: ${result.response.status} ${result.response.statusText} (final URL: ${result.response.url})\n` +
      `Response body:\n${truncatedBody}`;

    notify(`✅ Booked appointment at ${date} ${time} — HTTP ${result.response.status}`);
    notify(fullDetails, discordDetails);
    return true;
  }

}
