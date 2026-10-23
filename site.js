// Catalogue search, category filter and sort (progressive enhancement: all cards are already in the HTML).
(function () {
  var grid = document.getElementById('grid');
  if (grid) {
    var cards = Array.prototype.slice.call(grid.children);
    var q = document.getElementById('q');
    var sort = document.getElementById('sort');
    var chips = Array.prototype.slice.call(document.querySelectorAll('.chip'));
    var count = document.getElementById('count');
    var empty = document.getElementById('empty');
    var params = new URLSearchParams(location.search);
    var state = { q: params.get('q') || '', cat: params.get('category') || '', sort: params.get('sort') || 'recommended' };
    if (!chips.some(function (c) { return c.dataset.cat === state.cat; })) state.cat = '';
    q.value = state.q;
    sort.value = ['recommended', 'name', 'low', 'high'].indexOf(state.sort) > -1 ? state.sort : 'recommended';

    var compare = {
      recommended: function (a, b) { return a.dataset.i - b.dataset.i; },
      name: function (a, b) { return a.dataset.name.localeCompare(b.dataset.name); },
      low: function (a, b) { return a.dataset.price - b.dataset.price; },
      high: function (a, b) { return b.dataset.price - a.dataset.price; }
    };

    function apply() {
      var terms = state.q.toLowerCase().split(/\s+/).filter(Boolean);
      var shown = 0;
      cards.slice().sort(compare[sort.value]).forEach(function (card) {
        var ok = (!state.cat || card.dataset.cat === state.cat) &&
          terms.every(function (t) { return card.dataset.search.indexOf(t) > -1; });
        card.hidden = !ok;
        if (ok) shown++;
        grid.appendChild(card);
      });
      chips.forEach(function (c) { c.setAttribute('aria-pressed', String(c.dataset.cat === state.cat)); });
      count.textContent = shown + (shown === 1 ? ' product' : ' products');
      empty.hidden = shown > 0;
      var next = new URLSearchParams();
      if (state.q) next.set('q', state.q);
      if (state.cat) next.set('category', state.cat);
      if (sort.value !== 'recommended') next.set('sort', sort.value);
      var qs = next.toString();
      history.replaceState(null, '', location.pathname + (qs ? '?' + qs : ''));
    }

    q.addEventListener('input', function () { state.q = q.value.trim(); apply(); });
    sort.addEventListener('change', apply);
    chips.forEach(function (c) { c.addEventListener('click', function () { state.cat = c.dataset.cat; apply(); }); });
    apply();
  }

  // Product gallery: thumbnails swap the main image.
  var hero = document.getElementById('hero');
  if (hero) {
    Array.prototype.forEach.call(document.querySelectorAll('[data-thumb]'), function (b) {
      b.addEventListener('click', function () { hero.src = b.dataset.thumb; });
    });
  }
})();
