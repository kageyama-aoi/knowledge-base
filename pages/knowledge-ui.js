(function () {

  /* =========================
     THEME TOGGLE
  ========================= */

  const themeKey = 'knowledge-theme';
  const root = document.documentElement;

  const savedTheme = localStorage.getItem(themeKey);
  if (savedTheme) root.setAttribute('data-theme', savedTheme);

  const themeBtn = document.getElementById('toggleTheme');
  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      const next =
        root.getAttribute('data-theme') === 'light'
          ? 'dark'
          : 'light';

      root.setAttribute('data-theme', next);
      localStorage.setItem(themeKey, next);
    });
  }

  /* =========================
     DETAILS OPEN / CLOSE
  ========================= */

  const allDetails = Array.from(document.querySelectorAll('details'));

  const byKind = (kind) =>
    Array.from(document.querySelectorAll(`details[data-kind="${kind}"]`));

  const setOpen = (nodes, open) =>
    nodes.forEach(d => d.open = open);

  const bind = (id, handler) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('click', handler);
  };

  bind('openAll', () => setOpen(allDetails, true));
  bind('closeAll', () => setOpen(allDetails, false));
  bind('openSteps', () => {
    setOpen(allDetails, false);
    setOpen(byKind('step'), true);
    setOpen(byKind('info'), true);
  });
  bind('openTroubles', () => {
    setOpen(allDetails, false);
    setOpen(byKind('trouble'), true);
  });

  /* =========================
     URL SYNC (OPEN STATE)
  ========================= */

  const restoreFromHash = () => {
    const hash = location.hash.replace('#', '');
    if (!hash) return;

    hash.split(',').forEach(id => {
      const el = document.getElementById(id);
      if (el) el.open = true;
    });
  };

  const updateHash = () => {
    const openIds = allDetails
      .filter(d => d.open)
      .map(d => d.id);

    if (openIds.length === 0) {
      history.replaceState(null, '', location.pathname);
    } else {
      history.replaceState(null, '', `#${openIds.join(',')}`);
    }
  };

  allDetails.forEach(d =>
    d.addEventListener('toggle', updateHash)
  );

  restoreFromHash();

})();
