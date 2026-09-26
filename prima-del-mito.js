(() => {
  'use strict';
  const artwork = document.getElementById('artwork');
  const picture = document.getElementById('bridge-image');
  if (!artwork || !picture) return;
  const root = document.documentElement;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const requestedMode = new URLSearchParams(window.location.search).get('motion');
  const manualMode = requestedMode === 'full' ? 'full' : requestedMode === 'gentle' ? 'gentle' : null;
  let inView = true;
  let ready = false;
  let introTimer;
  let pulseTimer;
  const gentle = () => manualMode ? manualMode === 'gentle' : reduced.matches;
  const finishIntro = () => {
    artwork.classList.remove('is-entering');
    window.clearTimeout(introTimer);
  };
  const update = () => {
    const soft = gentle();
    root.dataset.motion = soft ? 'gentle' : 'full';
    const playing = ready && inView && !document.hidden;
    artwork.classList.toggle('is-alive', playing);
    artwork.classList.toggle('is-dormant', !playing);
  };
  const reveal = () => {
    if (ready) return;
    ready = true;
    const bounds = artwork.getBoundingClientRect();
    inView = bounds.bottom > 0 && bounds.top < window.innerHeight;
    if (inView && !window.location.hash && !document.hidden) {
      artwork.classList.add('is-entering');
      introTimer = window.setTimeout(finishIntro, 1900);
    }
    update();
  };
  // A touch makes the light bloom, with no audio or fabricated moving strings.
  artwork.querySelector('.art-window').addEventListener('click', () => {
    if (!ready) return;
    artwork.classList.remove('is-touched');
    void artwork.offsetWidth;
    artwork.classList.add('is-touched');
    window.clearTimeout(pulseTimer);
    pulseTimer = window.setTimeout(() => artwork.classList.remove('is-touched'), 1600);
  });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => {
      inView = entries[0].isIntersecting;
      if (!inView) finishIntro();
      update();
    }, { threshold: 0 }).observe(artwork);
  }
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) finishIntro();
    update();
  });
  // Safari's back/forward cache can restore a suspended animation timeline.
  window.addEventListener('pageshow', update);
  const onPreferenceChange = () => { finishIntro(); update(); };
  if (typeof reduced.addEventListener === 'function') reduced.addEventListener('change', onPreferenceChange);
  else if (typeof reduced.addListener === 'function') reduced.addListener(onPreferenceChange);

  // Attach listeners first, then handle an image already loaded from cache.
  picture.addEventListener('load', reveal, { once: true });
  picture.addEventListener('error', () => { finishIntro(); artwork.classList.add('image-unavailable'); }, { once: true });
  if (picture.complete && picture.naturalWidth) reveal();
  update();
})();
