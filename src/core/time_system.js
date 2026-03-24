var TimeSystem = (function () {
  var MONTHS = [
    "Январь",
    "Февраль",
    "Март",
    "Апрель",
    "Май",
    "Июнь",
    "Июль",
    "Август",
    "Сентябрь",
    "Октябрь",
    "Ноябрь",
    "Декабрь"
  ];
  var WEEKS_PER_MONTH = [4, 4, 5, 4, 4, 5, 4, 4, 5, 4, 4, 5];
  var WEEKS_PER_YEAR = 52;

  function clampInt(value, fallback) {
    var parsed = parseInt(value, 10);
    return isNaN(parsed) ? fallback : parsed;
  }

  function createCalendar(options) {
    var opts = options || {};
    return normalizeCalendar({
      startYear: clampInt(opts.startYear, 2026),
      startMonthIndex: clampInt(opts.startMonthIndex, 2),
      totalWeeks: clampInt(opts.totalWeeks, 0)
    });
  }

  function normalizeCalendar(calendar) {
    var normalized = calendar || {};
    normalized.startYear = clampInt(normalized.startYear, 2026);
    normalized.startMonthIndex = clampInt(normalized.startMonthIndex, 2);
    normalized.totalWeeks = clampInt(normalized.totalWeeks, 0);
    if (normalized.startMonthIndex < 0 || normalized.startMonthIndex >= MONTHS.length) {
      normalized.startMonthIndex = 2;
    }
    if (normalized.totalWeeks < 0) {
      normalized.totalWeeks = 0;
    }
    return normalized;
  }

  function buildProgress(calendar) {
    var normalized = normalizeCalendar(calendar);
    var year = normalized.startYear;
    var monthIndex = normalized.startMonthIndex;
    var weekOfMonth = 1;
    var step;
    for (step = 0; step < normalized.totalWeeks; step += 1) {
      weekOfMonth += 1;
      if (weekOfMonth > WEEKS_PER_MONTH[monthIndex]) {
        weekOfMonth = 1;
        monthIndex += 1;
        if (monthIndex >= MONTHS.length) {
          monthIndex = 0;
          year += 1;
        }
      }
    }
    return {
      weekNumber: normalized.totalWeeks + 1,
      year: year,
      monthIndex: monthIndex,
      monthName: MONTHS[monthIndex],
      weekOfMonth: weekOfMonth
    };
  }

  function advanceWeek(calendar) {
    var next = normalizeCalendar(calendar);
    next.totalWeeks += 1;
    return next;
  }

  function getCalendarView(calendar) {
    return buildProgress(calendar);
  }

  function getAgeView(startingAge, calendar) {
    var ageYears = Math.max(16, clampInt(startingAge, 16));
    var normalized = normalizeCalendar(calendar);
    var totalAgeWeeks = ageYears * WEEKS_PER_YEAR + normalized.totalWeeks;
    var years = Math.floor(totalAgeWeeks / WEEKS_PER_YEAR);
    var remainder = totalAgeWeeks % WEEKS_PER_YEAR;
    var monthIndex = 0;
    while (monthIndex < WEEKS_PER_MONTH.length && remainder >= WEEKS_PER_MONTH[monthIndex]) {
      remainder -= WEEKS_PER_MONTH[monthIndex];
      monthIndex += 1;
    }
    return {
      years: years,
      months: monthIndex,
      label: years + " г. " + monthIndex + " мес."
    };
  }

  return {
    MONTHS: MONTHS,
    WEEKS_PER_MONTH: WEEKS_PER_MONTH,
    WEEKS_PER_YEAR: WEEKS_PER_YEAR,
    createCalendar: createCalendar,
    normalizeCalendar: normalizeCalendar,
    advanceWeek: advanceWeek,
    getCalendarView: getCalendarView,
    getAgeView: getAgeView
  };
}());
