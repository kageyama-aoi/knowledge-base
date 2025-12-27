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
  const searchStatus = document.getElementById('search-status');

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const term = e.target.value.toLowerCase().trim();
      const allLinks = document.querySelectorAll('li a');
      const allDetails = document.querySelectorAll('details');
      let hitCount = 0;

      // 1. 各リンクをチェック
      allLinks.forEach(link => {
        const li = link.parentElement;
        const text = link.textContent.toLowerCase();
        const match = text.includes(term);
        li.style.display = match ? '' : 'none';
        if (match) hitCount++;
      });

      // 2. ステータス表示更新
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

      // 3. アーカイブの制御（検索中はすべて開く、空なら閉じるなど）
      if (term.length > 0) {
        // 検索中: マッチする項目が含まれる details だけ開く
        allDetails.forEach(d => {
            d.open = true;
            // 中身が全部消えているかチェック
            const listItems = d.querySelectorAll('li');
            const hasVisible = Array.from(listItems).some(li => li.style.display !== 'none');
            d.style.display = hasVisible ? '' : 'none';
        });

      } else {
        // 検索クリア: 表示を戻す
        allDetails.forEach(d => {
            d.style.display = ''; // details自体の非表示を解除
            // d.open = false; // 必要に応じて閉じる処理
        });
      }
    });
  }

})();
