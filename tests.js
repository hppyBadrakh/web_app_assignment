// tests.js
// Renders exam cards dynamically using the ExamCard component from components.js.
// Supports search filtering and interactive Like / Favorite / Save toggles.

(function () {
    'use strict';

    // ── Exam data ───────────────────────────────────────────────────────────
    var EXAMS = [
        { id: 1, icon: '\u{1F4D0}', iconColor: 'icon-blue',  name: '2024 оны Математикийн загвар тест',  price: '\u20AE18,900' },
        { id: 2, icon: '\u{1F4D2}', iconColor: 'icon-gold',  name: '2024 оны Монгол хэлний загвар тест', price: '\u20AE15,000' },
        { id: 3, icon: '\u{1F52C}', iconColor: 'icon-green', name: '2024 оны Физикийн загвар тест',      price: '\u20AE15,000' },
        { id: 4, icon: '\u{1F4D0}', iconColor: 'icon-blue',  name: '2023 оны Математикийн загвар тест',  price: '\u20AE12,000' },
        { id: 5, icon: '\u{1F4D2}', iconColor: 'icon-gold',  name: '2023 оны Монгол хэлний загвар тест', price: '\u20AE10,000' },
        { id: 6, icon: '\u{1F52C}', iconColor: 'icon-green', name: '2023 оны Физикийн загвар тест',      price: '\u20AE10,000' }
    ];

    // ── Map exam data to ExamCard props ─────────────────────────────────────
    function mapExamToProps(item, handlers, state) {
        return {
            icon:        item.icon,
            iconColor:   item.iconColor,
            name:        item.name,
            price:       item.price,
            actionText:  '\u0414\u044d\u043b\u0433\u044d\u0440\u044d\u043d\u0433\u04af\u0439',
            actionClass: 'green-btn',
            actionHref:  '#',
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

    var examList = TestHub.CardList({
        containerId: 'exam-grid',
        Component:   TestHub.ExamCard,
        mapItem:     mapExamToProps
    });

    // ── Filter + render ─────────────────────────────────────────────────────
    var _allExams = EXAMS;

    function renderExams(searchVal) {
        var query = (searchVal || '').trim().toLowerCase();
        var filtered = _allExams;
        if (query) {
            filtered = _allExams.filter(function (e) {
                return e.name.toLowerCase().indexOf(query) !== -1;
            });
        }
        examList.render(filtered);
    }

    // ── Search wiring ───────────────────────────────────────────────────────
    function wireSearch() {
        var input = document.getElementById('exam-search');
        if (!input) { return; }
        input.addEventListener('input', function () {
            renderExams(input.value);
        });
    }

    // ── Init ────────────────────────────────────────────────────────────────
    function init() {
        wireSearch();
        renderExams('');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
