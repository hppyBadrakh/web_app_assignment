// competitions.js
// Module: fetches competition data from jsonbin.io, stores in a local table,
// filters by search input, then renders cards into the page.

(function () {
    'use strict';
    // 1. DATA MODEL
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

    // 2. IN-MEMORY TABLE 
    let CompetitionTable = {
        _rows: [],

        load: function (rawArray) {
            this._rows = rawArray.map(function (r) { return new Competition(r); });
        },

        // Filter by status and an optional search query string
        query: function (params) {
            let status = params.status || null;   // 'upcoming' | 'past' | null = both
            let search = (params.search || '').trim().toLowerCase();

            return this._rows.filter(function (row) {
                if (status && row.status !== status) { return false; }
                if (search && row.title.toLowerCase().indexOf(search) === -1) { return false; }
                return true;
            });
        }
    };

    // 3. BUILDER 

    function createCard(item) {
        let card = document.createElement('div');
        card.className = 'item-card brutal';

        let top = document.createElement('div');
        top.className = item.muted ? 'card-top muted' : 'card-top';

        let trophy = document.createElement('span');
        trophy.appendChild(document.createTextNode('\ud83c\udfc6'));

        let badge = document.createElement('span');
        badge.className = 'badge ' + (item.muted ? 'gray' : 'yellow');
        badge.appendChild(document.createTextNode(item.date));

        top.appendChild(trophy);
        top.appendChild(badge);
        card.appendChild(top);

        let title = document.createElement('h3');
        title.appendChild(document.createTextNode(item.title));
        card.appendChild(title);

        let meta = document.createElement('p');
        meta.className = 'meta';
        meta.appendChild(document.createTextNode(item.meta));
        card.appendChild(meta);

        if (item.prize) {
            let prize = document.createElement('p');
            prize.className = 'prize';
            prize.appendChild(document.createTextNode('Шагнал: ' + item.prize));
            card.appendChild(prize);
        }

        let btn = document.createElement('a');
        btn.setAttribute('href', '#');
        btn.className = 'btn-brutal ' + item.actionClass;
        btn.appendChild(document.createTextNode(item.actionText));
        card.appendChild(btn);

        return card;
    }

    function renderInto(containerId, rows) {
        let container = document.getElementById(containerId);
        if (!container) { return; }

        while (container.firstChild) {
            container.removeChild(container.firstChild);
        }

        if (!rows || !rows.length) {
            const msg = document.createElement('p');
            msg.className = 'meta';
            msg.style.padding = '20px 0';
            msg.textContent = 'Тэмцээн олдсонгүй.';
            container.appendChild(msg);
            return;
        }

        for (let i = 0; i < rows.length; i++) {
            container.appendChild(createCard(rows[i]));
        }
    }

    // ── 4.RENDER

    function renderAll(searchOverride) {
        let searchInput = document.getElementById('competition-search');
        let searchVal = (searchOverride !== undefined)
            ? searchOverride
            : (searchInput ? searchInput.value : '');

        let upcomingRows = CompetitionTable.query({ status: 'upcoming', search: searchVal });
        let pastRows     = CompetitionTable.query({ status: 'past',     search: searchVal });

        renderInto('upcoming-grid', upcomingRows);
        renderInto('past-grid',     pastRows);
    }

    // 5. FETCH 
    let DATA_URL = 'https://api.jsonbin.io/v3/b/69bceb63b7ec241ddc860846';
    let SEED_DATA = [
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
            actionText: '\u041e\u0440\u043e\u043b\u0446\u043e\u043b\u0446\u043e\u0445',
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
        fetch(DATA_URL)
            .then(function (response) {
                if (!response.ok) {
                    throw new Error('HTTP ' + response.status);
                }
                return response.json();
            })
            .then(function (json) {
                // jsonbin.io wraps data under { record: [...] }
                let records = json.record || json;
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

    // ── 6. SEARCH WIRING ─────────────────────────────────────────────────────

    function wireSearch() {
        let searchInput = document.getElementById('competition-search');
        if (!searchInput) { return; }

        searchInput.addEventListener('input', function () {
            renderAll(searchInput.value);
        });
    }

    // ── 7. INIT ───────────────────────────────────────────────────────────────

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
