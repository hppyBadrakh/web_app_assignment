// competitions.js
// Module: fetches competition data from jsonbin.io, stores in a local table,
// filters by search input, then renders cards into the page
// using reusable ProductCard component from components.js.

(function () {
    'use strict';

    // ── 1. DATA MODEL ────────────────────────────────────────────────────────
    function Competition(raw) {
        this.id         = raw.id         || 0;
        this.title      = raw.title      || '';
        this.date       = raw.date       || '';
        this.meta       = raw.meta       || '';
        this.prize      = raw.prize      || null;
        this.actionText = raw.actionText || 'Дэлгэрэнгүй';
        this.actionClass = raw.actionClass || 'white-btn';
        this.status     = raw.status     || 'upcoming';
        this.muted      = (this.status === 'past');
    }

    // ── 2. IN-MEMORY TABLE ───────────────────────────────────────────────────
    var CompetitionTable = {
        _rows: [],

        load: function (rawArray) {
            this._rows = rawArray.map(function (r) { return new Competition(r); });
        },

        query: function (params) {
            var status = params.status || null;
            var search = (params.search || '').trim().toLowerCase();

            return this._rows.filter(function (row) {
                if (status && row.status !== status) { return false; }
                if (search && row.title.toLowerCase().indexOf(search) === -1) { return false; }
                return true;
            });
        }
    };

    // ── 3. CARD LIST SETUP (using components.js) ────────────────────────────
    // Maps Competition model to ProductCard props.

    function mapCompetitionToProps(item, handlers, state) {
        return {
            icon:        '\u{1F3C6}',
            iconClass:   item.muted ? 'gray' : 'yellow',
            date:        item.date,
            title:       item.title,
            meta:        item.meta,
            prize:       item.prize,
            actionText:  item.actionText,
            actionClass: item.actionClass,
            actionHref:  '#',
            muted:       item.muted,
            likes:       state.likes,
            favorites:   state.favorites,
            saves:       state.saves,
            liked:       state.liked,
            favorited:   state.favorited,
            saved:       state.saved,
            onLike:      handlers.onLike,
            onFavorite:  handlers.onFavorite,
            onSave:      handlers.onSave
        };
    }

    var upcomingList = TestHub.CardList({
        containerId: 'upcoming-grid',
        Component:   TestHub.ProductCard,
        mapItem:     mapCompetitionToProps
    });

    var pastList = TestHub.CardList({
        containerId: 'past-grid',
        Component:   TestHub.ProductCard,
        mapItem:     mapCompetitionToProps
    });

    // ── 4. RENDER CONTROLLER ─────────────────────────────────────────────────

    function renderAll(searchOverride) {
        var searchInput = document.getElementById('competition-search');
        var searchVal = (searchOverride !== undefined)
            ? searchOverride
            : (searchInput ? searchInput.value : '');

        var upcomingRows = CompetitionTable.query({ status: 'upcoming', search: searchVal });
        var pastRows     = CompetitionTable.query({ status: 'past',     search: searchVal });

        upcomingList.render(upcomingRows);
        pastList.render(pastRows);
    }

    // ── 5. FETCH ─────────────────────────────────────────────────────────────
    var DATA_URL = 'https://api.jsonbin.io/v3/b/69bceb63b7ec241ddc860846';
    var SEED_DATA = [
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

    // ── 6. SEARCH WIRING ─────────────────────────────────────────────────────

    function wireSearch() {
        var searchInput = document.getElementById('competition-search');
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
