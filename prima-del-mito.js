(() => {
  'use strict';
  const artwork = document.getElementById('artwork');
  const picture = document.getElementById('bridge-image');
  if (!artwork || !picture) return;
  const root = document.documentElement;
  const reduced = typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  const requestedMode = new URLSearchParams(window.location.search).get('motion');
  // Match the main site's owner-requested autoplay default on phones as well.
  // ?motion=gentle and ?motion=system remain available for reduced movement.
  let inView = true;
  let ready = false;
  let suspended = false;
  let visibilityFrame = null;
  let introTimer;
  let pulseTimer;
  const gentle = () => requestedMode === 'gentle' || (requestedMode === 'system' && reduced.matches);
  const measureVisibility = () => {
    const bounds = artwork.getBoundingClientRect();
    const viewportHeight = (window.visualViewport && window.visualViewport.height) || window.innerHeight;
    return bounds.bottom > 0 && bounds.top < viewportHeight;
  };
  const finishIntro = () => {
    artwork.classList.remove('is-entering');
    window.clearTimeout(introTimer);
  };
  const update = () => {
    const soft = gentle();
    const mode = soft ? 'gentle' : 'full';
    if (root.dataset.motion !== mode) root.dataset.motion = mode;
    const playing = ready && inView && !document.hidden && !suspended;
    artwork.classList.toggle('is-alive', playing);
    artwork.classList.toggle('is-dormant', !playing);
  };
  const reveal = () => {
    if (ready) return;
    ready = true;
    inView = measureVisibility();
    if (inView && !window.location.hash && !document.hidden) {
      artwork.classList.add('is-entering');
      introTimer = window.setTimeout(finishIntro, 1900);
    }
    update();
  };
  const refreshVisibility = () => {
    if (visibilityFrame !== null) window.cancelAnimationFrame(visibilityFrame);
    visibilityFrame = null;
    // A cached image may finish while Safari has suspended the page, without
    // a fresh load event when the visitor returns.
    if (!ready && picture.complete && picture.naturalWidth) reveal();
    inView = measureVisibility();
    update();
  };
  const queueVisibilityCheck = () => {
    if (suspended || document.hidden || visibilityFrame !== null) return;
    visibilityFrame = window.requestAnimationFrame(refreshVisibility);
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
    new IntersectionObserver(() => {
      // Use today's geometry, not a queued entry from before a page restore.
      refreshVisibility();
      if (!inView) finishIntro();
    }, { threshold: 0 }).observe(artwork);
  }
  // Intersection callbacks can lag behind a restored page or a changing iOS
  // browser toolbar. Recheck actual geometry too; no continuous JS animation.
  window.addEventListener('scroll', queueVisibilityCheck, { passive: true });
  window.addEventListener('resize', queueVisibilityCheck, { passive: true });
  window.addEventListener('orientationchange', queueVisibilityCheck, { passive: true });
  if (window.visualViewport) window.visualViewport.addEventListener('resize', queueVisibilityCheck, { passive: true });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) finishIntro();
    refreshVisibility();
    if (!document.hidden) queueVisibilityCheck();
  });
  window.addEventListener('pagehide', () => {
    suspended = true;
    if (visibilityFrame !== null) window.cancelAnimationFrame(visibilityFrame);
    visibilityFrame = null;
    finishIntro();
    update();
  });
  window.addEventListener('pageshow', () => {
    suspended = false;
    refreshVisibility();
    queueVisibilityCheck();
  });
  const onPreferenceChange = () => { finishIntro(); update(); };
  if (typeof reduced.addEventListener === 'function') reduced.addEventListener('change', onPreferenceChange);
  else if (typeof reduced.addListener === 'function') reduced.addListener(onPreferenceChange);

  // Attach listeners first, then handle an image already loaded from cache.
  picture.addEventListener('load', reveal, { once: true });
  picture.addEventListener('error', () => { finishIntro(); artwork.classList.add('image-unavailable'); }, { once: true });
  if (picture.complete && picture.naturalWidth) reveal();
  update();
})();
