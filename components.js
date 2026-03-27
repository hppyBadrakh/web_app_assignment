// components.js
// Reusable UI function components for TestHub.
// Each component receives data/callbacks as arguments, returns a DOM element,
// and re-renders when update() is called with new props.
// All DOM construction uses createElement — no innerHTML — for XHTML 1.0 Strict safety.

var TestHub = TestHub || {};

(function (ns) {
    'use strict';

    // ── HELPERS ─────────────────────────────────────────────────────────────

    /** Create an element, optionally set className, and append children/text. */
    function el(tag, className, children) {
        var node = document.createElement(tag);
        if (className) { node.className = className; }
        if (children !== undefined && children !== null) {
            if (typeof children === 'string' || typeof children === 'number') {
                node.appendChild(document.createTextNode(String(children)));
            } else if (Array.isArray(children)) {
                for (var i = 0; i < children.length; i++) {
                    if (children[i]) { node.appendChild(children[i]); }
                }
            } else {
                node.appendChild(children);
            }
        }
        return node;
    }

    /** Simple shallow-compare for re-render check. */
    function propsChanged(a, b) {
        if (a === b) { return false; }
        if (!a || !b) { return true; }
        var keys = Object.keys(a).concat(Object.keys(b));
        for (var i = 0; i < keys.length; i++) {
            if (a[keys[i]] !== b[keys[i]]) { return true; }
        }
        return false;
    }

    // ── PRODUCT CARD ────────────────────────────────────────────────────────
    // Reusable card with icon, date badge, title, meta, prize, action button,
    // and interactive Like / Favorite / Save toggle buttons with counters.
    //
    // Props:
    //   icon        : string   — emoji or text for the top-left icon
    //   iconClass   : string   — extra CSS class for the icon badge (e.g. 'yellow')
    //   date        : string   — date text shown in the badge
    //   title       : string   — card title
    //   meta        : string   — secondary text (e.g. participant count)
    //   prize       : string|null — prize text (omitted when null)
    //   actionText  : string   — button label
    //   actionClass : string   — button color class (e.g. 'green-btn')
    //   actionHref  : string   — button link (default '#')
    //   muted       : boolean  — dim the card-top section
    //   likes       : number   — current like count
    //   favorites   : number   — current favorite count
    //   saves       : number   — current save count
    //   liked       : boolean  — whether current user liked
    //   favorited   : boolean  — whether current user favorited
    //   saved       : boolean  — whether current user saved
    //   onLike      : function — called when like toggled
    //   onFavorite  : function — called when favorite toggled
    //   onSave      : function — called when save toggled

    function ProductCard(props) {
        var _props = props || {};
        var _root = null;

        function render() {
            var card = el('div', 'item-card brutal');

            // ── Top row: icon + date badge
            var top = el('div', _props.muted ? 'card-top muted' : 'card-top');
            var icon = el('span', null, _props.icon || '\u{1F3C6}');
            var badge = el('span', 'badge ' + (_props.muted ? 'gray' : (_props.iconClass || 'yellow')),
                           _props.date || '');
            top.appendChild(icon);
            top.appendChild(badge);
            card.appendChild(top);

            // ── Title
            card.appendChild(el('h3', null, _props.title || ''));

            // ── Meta
            if (_props.meta) {
                card.appendChild(el('p', 'meta', _props.meta));
            }

            // ── Prize
            if (_props.prize) {
                card.appendChild(el('p', 'prize', '\u0428\u0430\u0433\u043d\u0430\u043b: ' + _props.prize));
            }

            // ── Interactive buttons row (Like / Favorite / Save)
            var actions = el('div', 'card-actions');

            actions.appendChild(makeToggle(
                _props.liked, _props.likes || 0,
                '\u2764',    // ❤ heart
                '\u2661',    // ♡ heart outline
                'card-action-btn like-btn',
                function () { if (_props.onLike) { _props.onLike(); } }
            ));

            actions.appendChild(makeToggle(
                _props.favorited, _props.favorites || 0,
                '\u2605',    // ★ filled star
                '\u2606',    // ☆ empty star
                'card-action-btn fav-btn',
                function () { if (_props.onFavorite) { _props.onFavorite(); } }
            ));

            actions.appendChild(makeToggle(
                _props.saved, _props.saves || 0,
                '\u{1F516}', // 🔖 bookmark filled
                '\u{1F517}', // 🔗 bookmark outline (link icon as placeholder)
                'card-action-btn save-btn',
                function () { if (_props.onSave) { _props.onSave(); } }
            ));

            card.appendChild(actions);

            // ── Action button
            var btn = el('a', 'btn-brutal ' + (_props.actionClass || 'white-btn'),
                         _props.actionText || '\u0414\u044d\u043b\u0433\u044d\u0440\u044d\u043d\u0433\u04af\u0439');
            btn.setAttribute('href', _props.actionHref || '#');
            card.appendChild(btn);

            return card;
        }

        function makeToggle(active, count, activeIcon, inactiveIcon, className, onClick) {
            var btn = el('button', className + (active ? ' active' : ''));
            btn.setAttribute('type', 'button');

            var iconSpan = el('span', 'action-icon', active ? activeIcon : inactiveIcon);
            var countSpan = el('span', 'action-count', String(count));

            btn.appendChild(iconSpan);
            btn.appendChild(countSpan);

            btn.addEventListener('click', function (e) {
                e.preventDefault();
                e.stopPropagation();
                if (onClick) { onClick(); }
            });

            return btn;
        }

        _root = render();

        return {
            /** Returns the DOM element to mount into the page. */
            getElement: function () {
                return _root;
            },
            /** Re-render with new props. Replaces the DOM node in-place. */
            update: function (newProps) {
                if (!propsChanged(_props, newProps)) { return; }
                _props = newProps || {};
                var newRoot = render();
                if (_root.parentNode) {
                    _root.parentNode.replaceChild(newRoot, _root);
                }
                _root = newRoot;
            }
        };
    }

    // ── STAT CARD ───────────────────────────────────────────────────────────
    // Props:
    //   icon   : string — emoji icon
    //   number : string — stat number (e.g. '10,234')
    //   label  : string — description

    function StatCard(props) {
        var _props = props || {};
        var _root = null;

        function render() {
            var card = el('div', 'stat-card brutal', [
                el('div', 's-icon', _props.icon || ''),
                el('div', 's-num', _props.number || '0'),
                el('div', 's-label', _props.label || '')
            ]);
            return card;
        }

        _root = render();

        return {
            getElement: function () { return _root; },
            update: function (newProps) {
                if (!propsChanged(_props, newProps)) { return; }
                _props = newProps || {};
                var newRoot = render();
                if (_root.parentNode) {
                    _root.parentNode.replaceChild(newRoot, _root);
                }
                _root = newRoot;
            }
        };
    }

    // ── SEARCH INPUT ────────────────────────────────────────────────────────
    // Props:
    //   id          : string   — element id
    //   placeholder : string   — placeholder text
    //   ariaLabel   : string   — accessibility label
    //   value       : string   — current value
    //   onInput     : function — called with (value) on each input event

    function SearchInput(props) {
        var _props = props || {};
        var _root = null;

        function render() {
            var input = document.createElement('input');
            input.className = 'search-input';
            input.setAttribute('type', 'search');
            if (_props.id) { input.setAttribute('id', _props.id); }
            if (_props.placeholder) { input.setAttribute('placeholder', _props.placeholder); }
            if (_props.ariaLabel) { input.setAttribute('aria-label', _props.ariaLabel); }
            if (_props.value !== undefined) { input.value = _props.value; }

            input.addEventListener('input', function () {
                if (_props.onInput) { _props.onInput(input.value); }
            });

            return input;
        }

        _root = render();

        return {
            getElement: function () { return _root; },
            getValue: function () { return _root.value; },
            setValue: function (v) { _root.value = v; },
            update: function (newProps) {
                if (!propsChanged(_props, newProps)) { return; }
                _props = newProps || {};
                var newRoot = render();
                if (_root.parentNode) {
                    _root.parentNode.replaceChild(newRoot, _root);
                }
                _root = newRoot;
            }
        };
    }

    // ── EXAM CARD ───────────────────────────────────────────────────────────
    // Props:
    //   icon        : string — emoji inside the circle
    //   iconColor   : string — CSS class for the icon circle ('blue', 'gold', 'green')
    //   name        : string — exam name
    //   price       : string — price text (e.g. '₮ 5,000')
    //   actionText  : string — button text
    //   actionHref  : string — button link
    //   likes       : number
    //   favorites   : number
    //   saves       : number
    //   liked       : boolean
    //   favorited   : boolean
    //   saved       : boolean
    //   onLike      : function
    //   onFavorite  : function
    //   onSave      : function

    function ExamCard(props) {
        var _props = props || {};
        var _root = null;

        function makeToggle(active, count, activeIcon, inactiveIcon, className, onClick) {
            var btn = el('button', className + (active ? ' active' : ''));
            btn.setAttribute('type', 'button');
            btn.appendChild(el('span', 'action-icon', active ? activeIcon : inactiveIcon));
            btn.appendChild(el('span', 'action-count', String(count)));
            btn.addEventListener('click', function (e) {
                e.preventDefault();
                e.stopPropagation();
                if (onClick) { onClick(); }
            });
            return btn;
        }

        function render() {
            var card = el('div', 'exam-card brutal');

            // icon circle
            var iconWrap = el('div', 'exam-card-icon ' + (_props.iconColor || 'blue'));
            iconWrap.appendChild(document.createTextNode(_props.icon || '\u{1F4D6}'));
            card.appendChild(iconWrap);

            // name
            card.appendChild(el('div', 'exam-card-name', _props.name || ''));

            // price
            card.appendChild(el('div', 'exam-card-price', _props.price || ''));

            // interactive actions
            var actions = el('div', 'card-actions');
            actions.appendChild(makeToggle(
                _props.liked, _props.likes || 0,
                '\u2764', '\u2661', 'card-action-btn like-btn',
                function () { if (_props.onLike) { _props.onLike(); } }
            ));
            actions.appendChild(makeToggle(
                _props.favorited, _props.favorites || 0,
                '\u2605', '\u2606', 'card-action-btn fav-btn',
                function () { if (_props.onFavorite) { _props.onFavorite(); } }
            ));
            actions.appendChild(makeToggle(
                _props.saved, _props.saves || 0,
                '\u{1F516}', '\u{1F517}', 'card-action-btn save-btn',
                function () { if (_props.onSave) { _props.onSave(); } }
            ));
            card.appendChild(actions);

            // action button
            var btn = el('a', 'btn-brutal ' + (_props.actionClass || 'green-btn'),
                         _props.actionText || '\u0414\u044d\u043b\u0433\u044d\u0440\u044d\u043d\u0433\u04af\u0439');
            btn.setAttribute('href', _props.actionHref || '#');
            card.appendChild(btn);

            return card;
        }

        _root = render();

        return {
            getElement: function () { return _root; },
            update: function (newProps) {
                if (!propsChanged(_props, newProps)) { return; }
                _props = newProps || {};
                var newRoot = render();
                if (_root.parentNode) {
                    _root.parentNode.replaceChild(newRoot, _root);
                }
                _root = newRoot;
            }
        };
    }

    // ── CARD LIST (orchestrator) ────────────────────────────────────────────
    // Manages a list of cards with shared interaction state (likes, favorites,
    // saves). When a toggle is clicked the state updates and the single card
    // re-renders — not the entire list.
    //
    // Options:
    //   containerId : string           — id of the grid container
    //   Component   : function         — ProductCard or ExamCard
    //   mapItem     : function(item, handlers) → props
    //                 Takes a data item + { onLike, onFavorite, onSave } and
    //                 returns the full props object for the Component.

    function CardList(options) {
        var containerId = options.containerId;
        var Component = options.Component || ProductCard;
        var mapItem = options.mapItem;

        // interaction state keyed by item id
        var _state = {};
        var _cards = [];       // array of { component, id }
        var _items = [];       // current data items

        function getState(id) {
            if (!_state[id]) {
                _state[id] = { likes: 0, favorites: 0, saves: 0,
                               liked: false, favorited: false, saved: false };
            }
            return _state[id];
        }

        function toggleLike(id) {
            var s = getState(id);
            s.liked = !s.liked;
            s.likes += s.liked ? 1 : -1;
            reRenderCard(id);
        }

        function toggleFavorite(id) {
            var s = getState(id);
            s.favorited = !s.favorited;
            s.favorites += s.favorited ? 1 : -1;
            reRenderCard(id);
        }

        function toggleSave(id) {
            var s = getState(id);
            s.saved = !s.saved;
            s.saves += s.saved ? 1 : -1;
            reRenderCard(id);
        }

        function reRenderCard(id) {
            for (var i = 0; i < _cards.length; i++) {
                if (_cards[i].id === id) {
                    var item = _items[i];
                    var s = getState(id);
                    var handlers = {
                        onLike:     function () { toggleLike(id); },
                        onFavorite: function () { toggleFavorite(id); },
                        onSave:     function () { toggleSave(id); }
                    };
                    var props = mapItem(item, handlers, s);
                    _cards[i].component.update(props);
                    break;
                }
            }
        }

        function render(items) {
            var container = document.getElementById(containerId);
            if (!container) { return; }

            // clear
            while (container.firstChild) { container.removeChild(container.firstChild); }
            _cards = [];
            _items = items || [];

            if (_items.length === 0) {
                var empty = el('p', 'meta');
                empty.style.padding = '20px 0';
                empty.appendChild(document.createTextNode('\u0422\u044d\u043c\u0446\u044d\u044d\u043d \u043e\u043b\u0434\u0441\u043e\u043d\u0433\u04af\u0439.'));
                container.appendChild(empty);
                return;
            }

            for (var i = 0; i < _items.length; i++) {
                (function (item) {
                    var id = item.id || i;
                    var s = getState(id);
                    var handlers = {
                        onLike:     function () { toggleLike(id); },
                        onFavorite: function () { toggleFavorite(id); },
                        onSave:     function () { toggleSave(id); }
                    };
                    var props = mapItem(item, handlers, s);
                    var comp = Component(props);
                    _cards.push({ id: id, component: comp });
                    container.appendChild(comp.getElement());
                })(_items[i]);
            }
        }

        return {
            render: render
        };
    }

    // ── PUBLIC API ──────────────────────────────────────────────────────────
    ns.ProductCard = ProductCard;
    ns.StatCard    = StatCard;
    ns.SearchInput = SearchInput;
    ns.ExamCard    = ExamCard;
    ns.CardList    = CardList;

})(TestHub);
