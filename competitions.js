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
                "id": 1,
                "title": "2026 оны Хаврын Математикийн аварга шалгаруулах тэмцээн",
                "date": "4-р сарын 15",
                "meta": "1,247 оролцогч",
                "prize": "$500 + Гэрчилгээ",
                "actionText": "Оролцох",
                "actionClass": "green-btn",
                "status": "upcoming"
                },
                {
                "id": 2,
                "title": "Англи хэлний шилдэгүүдийн уралдаан",
                "date": "4-р сарын 22",
                "meta": "892 оролцогч",
                "prize": "$300 + Гэрчилгээ",
                "actionText": "Оролцох",
                "actionClass": "green-btn",
                "status": "upcoming"
                },
                {
                "id": 3,
                "title": "Түргэн Математикийн Шалгалт",
                "date": "3-р сарын 30",
                "meta": "1,523 оролцогч",
                "prize": "Гэрчилгээ",
                "actionText": "Оролцолцох",
                "actionClass": "green-btn",
                "status": "upcoming"
                },
                {
                "id": 4,
                "title": "2025 оны Өвлийн Математикийн Челленж",
                "date": "2025 оны 12-р сарын 10",
                "meta": "2,156 оролцогч",
                "prize": null,
                "actionText": "Үр дүнг харах",
                "actionClass": "white-btn",
                "status": "past"
                },
                {
                "id": 5,
                "title": "2025 оны Граммасыин Мастер",
                "date": "2025 оны 11-р сарын 5",
                "meta": "1,834 оролцогч",
                "prize": null,
                "actionText": "Үр дүнг харах",
                "actionClass": "white-btn",
                "status": "past"
                },
                {
                "id": 6,
                "title": "2026 оны Граммасыин Мастер",
                "date": "2026 оны 11-р сарын 5",
                "meta": "1,834 оролцогч",
                "prize": null,
                "actionText": "Үр дүнг харах",
                "actionClass": "white-btn",
                "status": "past"
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
