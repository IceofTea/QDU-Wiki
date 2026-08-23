; (function () {
  'use strict';

  /* 友链卡片截图展开/收起：
     桌面端由 CSS :hover 驱动，触屏端由点击 .is-open 驱动。
     事件委托在 document 上，兼容 Material instant 导航。 */

  function onClick(ev) {
    var shot = ev.target.closest ? ev.target.closest('.friend-card__screenshot') : null;
    if (!shot) return;
    ev.preventDefault();
    ev.stopPropagation();
    shot.classList.toggle('is-open');
  }

  document.addEventListener('click', onClick, true);
})();