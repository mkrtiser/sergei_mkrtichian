(() => {
  'use strict';
  const element = (tag, text) => { const node = document.createElement(tag); node.textContent = text; return node; };
  fetch('concerts.json', { cache: 'no-store' }).then(response => {
    if (!response.ok) throw new Error('Archive unavailable');
    return response.json();
  }).then(data => {
    const { past } = ConcertData.split(data.concerts);
    const fragment = document.createDocumentFragment();
    past.forEach(concert => {
      const article = element('article', ''); article.className = 'archive-item';
      const date = new Date(`${concert.date}T12:00:00Z`);
      const time = element('time', new Intl.DateTimeFormat('en', { timeZone: 'Europe/Zurich', day: 'numeric', month: 'long', year: 'numeric' }).format(date));
      time.dateTime = concert.date;
      const info = element('div', '');
      info.append(element('h2', concert.title || 'Concert'), element('p', [concert.venue, concert.city, concert.country].filter(Boolean).join(' · ')));
      if (concert.description) info.append(element('p', concert.description));
      const raw = concert.kind === 'hosted' ? ConcertData.detailUrl(concert, location.href) : concert.externalUrl;
      if (raw) {
        try {
          const url = new URL(raw, location.href);
          if (['http:', 'https:'].includes(url.protocol)) {
            const link = element('a', concert.kind === 'hosted' ? 'The concert & programme →' : 'Official event page ↗');
            link.className = 'text-link'; link.href = url.href;
            if (url.origin !== location.origin) { link.target = '_blank'; link.rel = 'noopener noreferrer'; }
            info.append(link);
          }
        } catch { /* Keep the archive text readable even with an invalid URL. */ }
      }
      article.append(time, info); fragment.append(article);
    });
    if (!past.length) fragment.append(element('p', 'The archive will grow after each concert.'));
    document.getElementById('archive-list').replaceChildren(fragment);
  }).catch(() => { document.getElementById('archive-error').hidden = false; });
})();
