// competitions.js
// Module: fetches competition data from jsonbin.io, stores in a local table,
// filters by URL params and search input, then renders cards into the page.

(function () {
    'use strict';

    // ── 1. DATA MODEL ────────────────────────────────────────────────────────
    // Competition class — represents one competition entry from the JSON source.

    function Competition(raw) {
        this.id         = raw.id         || 0;
        this.title      = raw.title      || '';
        this.date       = raw.date       || '';
        this.meta       = raw.meta       || '';
        this.prize      = raw.prize      || null;
        this.actionText = raw.actionText || 'Дэлгэрэнгүй';
        this.actionClass = raw.actionClass || 'white-btn';
        this.status     = raw.status     || 'upcoming'; // 'upcoming' | 'past'
        this.muted      = (this.status === 'past');
    }

    // ── 2. IN-MEMORY TABLE ───────────────────────────────────────────────────
    // After fetching, all records live here. Filtering always reads from this
    // table — never re-fetches.

    var CompetitionTable = {
        _rows: [],

        load: function (rawArray) {
            this._rows = rawArray.map(function (r) { return new Competition(r); });
        },

        // Filter by status and an optional search query string
        query: function (params) {
            var status = params.status || null;   // 'upcoming' | 'past' | null = both
            var search = (params.search || '').trim().toLowerCase();

            return this._rows.filter(function (row) {
                if (status && row.status !== status) { return false; }
                if (search && row.title.toLowerCase().indexOf(search) === -1) { return false; }
                return true;
            });
        }
    };

    // ── 3. URL PARAMETER READER ──────────────────────────────────────────────
    // Reads ?status=past&search=математик from the address bar.

    function getUrlParams() {
        var params = { status: null, search: '' };
        var search = window.location.search;
        if (!search) { return params; }

        var pairs = search.slice(1).split('&');
        for (var i = 0; i < pairs.length; i++) {
            var kv = pairs[i].split('=');
            var key = decodeURIComponent(kv[0]);
            var val = kv[1] ? decodeURIComponent(kv[1].replace(/\+/g, ' ')) : '';
            if (key === 'status') { params.status = val; }
            if (key === 'search') { params.search = val; }
        }
        return params;
    }

    // ── 4. DOM BUILDER ───────────────────────────────────────────────────────
    // Builds card elements with createElement — no innerHTML, XHTML safe.

    function createCard(item) {
        var card = document.createElement('div');
        card.className = 'item-card brutal';

        var top = document.createElement('div');
        top.className = item.muted ? 'card-top muted' : 'card-top';

        var trophy = document.createElement('span');
        trophy.appendChild(document.createTextNode('\ud83c\udfc6'));

        var badge = document.createElement('span');
        badge.className = 'badge ' + (item.muted ? 'gray' : 'yellow');
        badge.appendChild(document.createTextNode(item.date));

        top.appendChild(trophy);
        top.appendChild(badge);
        card.appendChild(top);

        var title = document.createElement('h3');
        title.appendChild(document.createTextNode(item.title));
        card.appendChild(title);

        var meta = document.createElement('p');
        meta.className = 'meta';
        meta.appendChild(document.createTextNode(item.meta));
        card.appendChild(meta);

        if (item.prize) {
            var prize = document.createElement('p');
            prize.className = 'prize';
            prize.appendChild(document.createTextNode('\u0428\u0430\u0433\u043d\u0430\u043b: ' + item.prize));
            card.appendChild(prize);
        }

        var btn = document.createElement('a');
        btn.setAttribute('href', '#');
        btn.className = 'btn-brutal ' + item.actionClass;
        btn.appendChild(document.createTextNode(item.actionText));
        card.appendChild(btn);

        return card;
    }

    function renderInto(containerId, rows) {
        var container = document.getElementById(containerId);
        if (!container) { return; }

        while (container.firstChild) {
            container.removeChild(container.firstChild);
        }

        if (!rows || rows.length === 0) {
            var empty = document.createElement('p');
            empty.className = 'meta';
            empty.style.padding = '20px 0';
            empty.appendChild(document.createTextNode('\u0422\u044d\u043c\u0446\u044d\u044d\u043d \u043e\u043b\u0434\u0441\u043e\u043d\u0433\u04af\u0439.'));
            container.appendChild(empty);
            return;
        }

        for (var i = 0; i < rows.length; i++) {
            container.appendChild(createCard(rows[i]));
        }
    }

    // ── 5. RENDER CONTROLLER ─────────────────────────────────────────────────
    // Reads current search input + URL params, queries the table, renders both grids.

    function renderAll(searchOverride) {
        var urlParams = getUrlParams();
        var searchInput = document.getElementById('competition-search');
        var searchVal = (searchOverride !== undefined)
            ? searchOverride
            : (searchInput ? searchInput.value : (urlParams.search || ''));

        var upcomingRows = CompetitionTable.query({ status: 'upcoming', search: searchVal });
        var pastRows     = CompetitionTable.query({ status: 'past',     search: searchVal });

        renderInto('upcoming-grid', upcomingRows);
        renderInto('past-grid',     pastRows);
    }

    // ── 6. LOADING STATE ─────────────────────────────────────────────────────

    function showLoading(containerId) {
        var container = document.getElementById(containerId);
        if (!container) { return; }
        while (container.firstChild) { container.removeChild(container.firstChild); }
        var msg = document.createElement('p');
        msg.className = 'meta';
        msg.style.padding = '20px 0';
        msg.appendChild(document.createTextNode('\u0422\u04af\u0440 \u0443\u043d\u0448\u0430\u0430\u0436 \u0431\u0430\u0439\u043d\u0430...'));
        container.appendChild(msg);
    }

    function showError(containerId, message) {
        var container = document.getElementById(containerId);
        if (!container) { return; }
        while (container.firstChild) { container.removeChild(container.firstChild); }
        var msg = document.createElement('p');
        msg.className = 'meta';
        msg.style.padding = '20px 0';
        msg.style.color = '#c0392b';
        msg.appendChild(document.createTextNode(message));
        container.appendChild(msg);
    }

    // ── 7. FETCH ─────────────────────────────────────────────────────────────
    // Fetches from jsonbin.io. If fetch fails, falls back to inline seed data.

    // Public jsonbin.io bin — read-only, no API key needed for public bins.
    // BIN ID: 68799e238960c979a59706ab
    var DATA_URL = 'https://api.jsonbin.io/v3/b/68799e238960c979a59706ab/latest';

    // Seed data used as fallback if the network request fails
    var SEED_DATA = [
        {
            id: 1,
            title: '2026 \u043e\u043d\u044b \u0425\u0430\u0432\u0440\u044b\u043d \u041c\u0430\u0442\u0435\u043c\u0430\u0442\u0438\u043a\u0438\u0439\u043d \u0430\u0432\u0430\u0440\u0433\u0430 \u0448\u0430\u043b\u0433\u0430\u0440\u0443\u0443\u043b\u0430\u0445 \u0442\u044d\u043c\u0446\u044d\u044d\u043d',
            date: '4-\u0440 \u0441\u0430\u0440\u044b\u043d 15',
            meta: '1,247 \u043e\u0440\u043e\u043b\u0446\u043e\u0433\u0447',
            prize: '$500 + \u0413\u044d\u0440\u0447\u0438\u043b\u0433\u044d\u044d',
            actionText: '\u041e\u0440\u043e\u043b\u0446\u043e\u0445',
            actionClass: 'green-btn',
            status: 'upcoming'
        },
        {
            id: 2,
            title: '\u0410\u043d\u0433\u043b\u0438 \u0445\u044d\u043b\u043d\u0438\u0439 \u0448\u0438\u043b\u0434\u044d\u0433\u04af\u04af\u0434\u0438\u0439\u043d \u0443\u0440\u0430\u043b\u0434\u0430\u0430\u043d',
            date: '4-\u0440 \u0441\u0430\u0440\u044b\u043d 22',
            meta: '892 \u043e\u0440\u043e\u043b\u0446\u043e\u0433\u0447',
            prize: '$300 + \u0413\u044d\u0440\u0447\u0438\u043b\u0433\u044d\u044d',
            actionText: '\u041e\u0440\u043e\u043b\u0446\u043e\u0445',
            actionClass: 'green-btn',
            status: 'upcoming'
        },
        {
            id: 3,
            title: '\u0422\u04af\u0440\u0433\u044d\u043d \u041c\u0430\u0442\u0435\u043c\u0430\u0442\u0438\u043a\u0438\u0439\u043d \u0428\u0430\u043b\u0433\u0430\u043b\u0442',
            date: '3-\u0440 \u0441\u0430\u0440\u044b\u043d 30',
            meta: '1,523 \u043e\u0440\u043e\u043b\u0446\u043e\u0433\u0447',
            prize: '\u0413\u044d\u0440\u0447\u0438\u043b\u0433\u044d\u044d',
            actionText: '\u041e\u0440\u043e\u043b\u0446\u043e\u0445',
            actionClass: 'green-btn',
            status: 'upcoming'
        },
        {
            id: 4,
            title: '2025 \u043e\u043d\u044b \u04e8\u0432\u043b\u0438\u0439\u043d \u041c\u0430\u0442\u0435\u043c\u0430\u0442\u0438\u043a\u0438\u0439\u043d \u0427\u0435\u043b\u043b\u0435\u043d\u0436',
            date: '2025 \u043e\u043d\u044b 12-\u0440 \u0441\u0430\u0440\u044b\u043d 10',
            meta: '2,156 \u043e\u0440\u043e\u043b\u0446\u043e\u0433\u0447',
            prize: null,
            actionText: '\u04ae\u0440 \u0434\u04af\u043d\u0433 \u0445\u0430\u0440\u0430\u0445',
            actionClass: 'white-btn',
            status: 'past'
        },
        {
            id: 5,
            title: '2025 \u043e\u043d\u044b \u0413\u0440\u0430\u043c\u043c\u0430\u0441\u044b\u043d \u041c\u0430\u0441\u0442\u0435\u0440',
            date: '2025 \u043e\u043d\u044b 11-\u0440 \u0441\u0430\u0440\u044b\u043d 5',
            meta: '1,834 \u043e\u0440\u043e\u043b\u0446\u043e\u0433\u0447',
            prize: null,
            actionText: '\u04ae\u0440 \u0434\u04af\u043d\u0433 \u0445\u0430\u0440\u0430\u0445',
            actionClass: 'white-btn',
            status: 'past'
        }
    ];

    function fetchData() {
        showLoading('upcoming-grid');
        showLoading('past-grid');

        fetch(DATA_URL)
            .then(function (response) {
                if (!response.ok) {
                    throw new Error('HTTP ' + response.status);
                }
                return response.json();
            })
            .then(function (json) {
                // jsonbin.io wraps data under { record: [...] }
                var records = json.record || json;
                if (!Array.isArray(records)) {
                    throw new Error('Unexpected data format');
                }
                CompetitionTable.load(records);
                renderAll();
            })
            .catch(function (err) {
                console.warn('Fetch failed, using seed data:', err);
                CompetitionTable.load(SEED_DATA);
                renderAll();
            });
    }

    // ── 8. SEARCH WIRING ─────────────────────────────────────────────────────

    function wireSearch() {
        var searchInput = document.getElementById('competition-search');
        if (!searchInput) { return; }

        // Pre-fill search input from URL param if present
        var urlParams = getUrlParams();
        if (urlParams.search) {
            searchInput.value = urlParams.search;
        }

        searchInput.addEventListener('input', function () {
            renderAll(searchInput.value);
        });
    }

    // ── 9. INIT ───────────────────────────────────────────────────────────────

    function init() {
        wireSearch();
        fetchData();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();