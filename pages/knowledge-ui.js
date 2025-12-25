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
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const term = e.target.value.toLowerCase();
      const allLinks = document.querySelectorAll('li a');
      const allDetails = document.querySelectorAll('details');

      // 1. 各リンクをチェック
      allLinks.forEach(link => {
        const li = link.parentElement;
        const text = link.textContent.toLowerCase();
        const match = text.includes(term);
        li.style.display = match ? '' : 'none';
      });

      // 2. アーカイブの制御（検索中はすべて開く、空なら閉じるなど）
      if (term.length > 0) {
        // 検索中: マッチする項目が含まれる details だけ開く、あるいは全部開く
        // シンプルに「全部開いて、空のリストは見せない」戦略で行く
        allDetails.forEach(d => {
            d.open = true;
            // 中身が全部消えているかチェック
            const listItems = d.querySelectorAll('li');
            const hasVisible = Array.from(listItems).some(li => li.style.display !== 'none');
            d.style.display = hasVisible ? '' : 'none';
        });
        
        // 最新セクションなども、空なら隠したい場合は親要素を遡って制御が必要だが、
        // 簡易的には「ヒットングなし」でも枠は残る。
        // ここでは「詳細」ブロック（月別）の表示/非表示だけ制御する。

      } else {
        // 検索クリア: 表示を戻す
        allDetails.forEach(d => {
            d.style.display = ''; // details自体の非表示を解除
            // d.open = false; // お好みで閉じる。あるいは元の状態に戻すのは難しいので「閉じる」か「そのまま」
        });
      }
    });
  }

})();
