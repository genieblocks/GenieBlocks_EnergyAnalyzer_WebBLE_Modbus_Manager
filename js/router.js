'use strict';

(function() {
  function showPage(pageId) {
    document.querySelectorAll('.page').forEach(function(p) {
      p.classList.remove('active');
    });
    document.querySelectorAll('#bottom-nav .nav-btn').forEach(function(b) {
      b.classList.remove('active');
    });

    var page = document.getElementById('page-' + pageId);
    if (page) page.classList.add('active');

    var btn = document.querySelector('#bottom-nav .nav-btn[data-page="' + pageId + '"]');
    if (btn) btn.classList.add('active');

    window.scrollTo(0, 0);

    if (pageId === 'charts' && typeof window.resizeAllCharts === 'function') {
      requestAnimationFrame(function() {
        window.resizeAllCharts();
        setTimeout(window.resizeAllCharts, 200);
      });
    }
  }

  window.showPage = showPage;

  document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('#bottom-nav .nav-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        showPage(this.dataset.page);
      });
    });

    showPage('dashboard');
  });
})();
