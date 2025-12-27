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

    /* =========================
     SEARCH FUNCTION
  ========================= */
  const searchInput = document.getElementById('searchDocs');
  const clearBtn = document.getElementById('clearSearch');
  const searchStatus = document.getElementById('search-status');

  const renderHighlight = (node, original, term) => {
    if (!term) {
      node.textContent = original;
      return;
    }

    const originalLower = original.toLowerCase();
    const termLower = term.toLowerCase();
    let start = 0;
    let index = originalLower.indexOf(termLower, start);

    if (index == -1) {
      node.textContent = original;
      return;
    }

    node.textContent = '';

    while (index != -1) {
      if (index > start) {
        node.appendChild(document.createTextNode(original.slice(start, index)));
      }

      const mark = document.createElement('span');
      mark.className = 'search-highlight';
      mark.textContent = original.slice(index, index + term.length);
      node.appendChild(mark);

      start = index + term.length;
      index = originalLower.indexOf(termLower, start);
    }

    if (start < original.length) {
      node.appendChild(document.createTextNode(original.slice(start)));
    }
  };

  const applySearch = () => {
    const term = searchInput.value.toLowerCase().trim();
    const allLinks = document.querySelectorAll('li a');
    const allDetails = document.querySelectorAll('details');
    let hitCount = 0;

    allLinks.forEach(link => {
      const li = link.parentElement;
      const titleNode = link.querySelector('.doc-title');
      const original = link.dataset.title || (titleNode ? titleNode.textContent : link.textContent);
      const searchText = link.dataset.search || original;
      const match = term.length === 0 || searchText.toLowerCase().includes(term);
      li.style.display = match ? '' : 'none';
      if (match && term.length > 0) hitCount++;
      if (titleNode) {
        renderHighlight(titleNode, original, term);
      } else {
        renderHighlight(link, original, term);
      }
    });

    if (term.length > 0) {
      if (hitCount > 0) {
        searchStatus.textContent = `${hitCount} 件見つかりました`;
        searchStatus.className = 'search-status found';
      } else {
        searchStatus.textContent = '見つかりませんでした';
        searchStatus.className = 'search-status not-found';
      }
    } else {
      searchStatus.textContent = '';
      searchStatus.className = 'search-status';
    }

    if (clearBtn) {
      clearBtn.classList.toggle('is-visible', term.length > 0);
    }

    if (term.length > 0) {
      allDetails.forEach(d => {
        d.open = true;
        const listItems = d.querySelectorAll('li');
        const hasVisible = Array.from(listItems).some(li => li.style.display != 'none');
        d.style.display = hasVisible ? '' : 'none';
      });
    } else {
      allDetails.forEach(d => {
        d.style.display = '';
      });
    }
  };

  if (searchInput) {
    searchInput.addEventListener('input', applySearch);

    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        searchInput.value = '';
        applySearch();
        searchInput.focus();
      });
    }

    document.addEventListener('keydown', (e) => {
      const target = e.target;
      const tag = target && target.tagName;
      const isEditable = target && (target.isContentEditable || tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT');
      if (e.key === '/' && !isEditable) {
        e.preventDefault();
        searchInput.focus();
        searchInput.select();
      }
    });
  }

})();
