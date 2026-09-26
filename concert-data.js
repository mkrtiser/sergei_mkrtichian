/* Shared date/routing rules for the live calendar and its archive. */
(function (root) {
  'use strict';
  const validDate = value => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value))) return false;
    const date = new Date(`${value}T12:00:00Z`);
    return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
  };
  const todayInZurich = (now = new Date()) => {
    const parts = new Intl.DateTimeFormat('en', {
      timeZone: 'Europe/Zurich', year: 'numeric', month: '2-digit', day: '2-digit'
    }).formatToParts(now);
    return ['year', 'month', 'day'].map(key => parts.find(part => part.type === key).value).join('-');
  };
  const split = (concerts, now = new Date()) => {
    const today = todayInZurich(now);
    const published = (Array.isArray(concerts) ? concerts : []).filter(concert =>
      concert && concert.published !== false && concert.status !== 'hidden' && validDate(concert.date));
    const isPast = concert => ['past', 'archived'].includes(concert.status) || concert.date < today;
    return {
      upcoming: published.filter(concert => !isPast(concert)).sort((a, b) => a.date.localeCompare(b.date)),
      past: published.filter(isPast).sort((a, b) => b.date.localeCompare(a.date))
    };
  };
  const localFile = (value, base, extension) => {
    if (typeof value !== 'string' || !value.trim()) return '';
    try {
      const url = new URL(value, base);
      const origin = new URL(base).origin;
      return ['http:', 'https:'].includes(url.protocol) && url.origin === origin
        && url.pathname.endsWith(extension) && !url.username && !url.password ? url.href : '';
    } catch { return ''; }
  };
  const detailUrl = (concert, base) => localFile(concert.pageUrl, base, '.html')
    || (concert.id ? `concert.html?id=${encodeURIComponent(concert.id)}${concert._preview ? '&preview=1' : ''}` : '');
  const calendarUrl = (concert, base) => localFile(concert.calendarUrl, base, '.ics');
  const api = Object.freeze({ validDate, todayInZurich, split, detailUrl, calendarUrl });
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.ConcertData = api;
})(typeof window === 'undefined' ? globalThis : window);
