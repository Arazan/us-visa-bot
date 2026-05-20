import dotenv from 'dotenv';

dotenv.config();

export function getConfig() {
  const refreshDelayMin = Number(process.env.REFRESH_DELAY_MIN ?? 60);
  const refreshDelayMax = Number(process.env.REFRESH_DELAY_MAX ?? 120);

  const config = {
    // Credentials / target site
    email: process.env.EMAIL,
    password: process.env.PASSWORD,
    scheduleId: process.env.SCHEDULE_ID,
    facilityId: process.env.FACILITY_ID,
    countryCode: process.env.COUNTRY_CODE,

    // Polling cadence
    refreshDelayMin,
    refreshDelayMax,

    // Run parameters (previously CLI flags)
    currentDate: process.env.CURRENT_DATE,
    targetDate: process.env.TARGET_DATE || undefined,
    minDate: process.env.MIN_DATE || undefined,
    dryRun: parseBool(process.env.DRY_RUN),
    maxLoops: parsePositiveInt('MAX_LOOPS', process.env.MAX_LOOPS),
    maxBookings: parsePositiveInt('MAX_BOOKINGS', process.env.MAX_BOOKINGS)
  };

  validateConfig(config);
  return config;
}

function parseBool(value) {
  if (value === undefined || value === '') return false;
  return /^(1|true|yes|on)$/i.test(String(value).trim());
}

function parsePositiveInt(name, value) {
  if (value === undefined || value === '') return undefined;
  const n = Number.parseInt(value, 10);
  if (!Number.isFinite(n) || n <= 0) {
    console.error(`Invalid ${name}: expected a positive integer, got "${value}"`);
    process.exit(1);
  }
  return n;
}

function validateConfig(config) {
  const required = ['email', 'password', 'scheduleId', 'facilityId', 'countryCode', 'currentDate'];
  const missing = required.filter(key => !config[key]);

  if (missing.length > 0) {
    const envNames = {
      email: 'EMAIL',
      password: 'PASSWORD',
      scheduleId: 'SCHEDULE_ID',
      facilityId: 'FACILITY_ID',
      countryCode: 'COUNTRY_CODE',
      currentDate: 'CURRENT_DATE'
    };
    console.error(`Missing required environment variables: ${missing.map(k => envNames[k]).join(', ')}`);
    process.exit(1);
  }

  const dateRe = /^\d{4}-\d{2}-\d{2}$/;
  const dateEnvNames = { currentDate: 'CURRENT_DATE', targetDate: 'TARGET_DATE', minDate: 'MIN_DATE' };
  for (const key of Object.keys(dateEnvNames)) {
    if (config[key] && !dateRe.test(config[key])) {
      console.error(`Invalid ${dateEnvNames[key]}: expected YYYY-MM-DD, got "${config[key]}"`);
      process.exit(1);
    }
  }

  if (
    !Number.isFinite(config.refreshDelayMin) ||
    !Number.isFinite(config.refreshDelayMax) ||
    config.refreshDelayMin <= 0 ||
    config.refreshDelayMax < config.refreshDelayMin
  ) {
    console.error(
      `Invalid REFRESH_DELAY_MIN/REFRESH_DELAY_MAX (got ${config.refreshDelayMin}/${config.refreshDelayMax}). ` +
      `Both must be positive numbers and MAX must be >= MIN.`
    );
    process.exit(1);
  }
}

export function getBaseUri(countryCode) {
  return `https://ais.usvisa-info.com/en-${countryCode}/niv`;
}
