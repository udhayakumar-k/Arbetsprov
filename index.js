var api = {
    get: function(url, successFn, errorFn) {
        var req = new XMLHttpRequest();
        req.open('GET', url, true);
        req.onload = function() {
            if (req.status === 200 && this.response) {
                var data = JSON.parse(this.response);
                successFn(data)
            } else {
                errorFn(req.status, this.response);
            }
        }
        req.send();
    }
};
var app = {
    debounceTimeOut: null,
    $searchInput: null,
    $searchResult: null,
    $searchHistory: null,
    $searchHistoryBody: null,
    currentFocus: 0,
    historyTemplate: '',
    init: function() {
        app.$searchInput = document.querySelector('#input-search');
        app.$searchResult = document.querySelector('#search-result');
        app.$searchHistory = document.querySelector('#search-history-wrapper');
        app.$searchHistoryBody = document.querySelector('#search-history tbody');
        app.historyTemplate = document.querySelector('#history-template').innerHTML;
        if (!app.$searchInput || !app.$searchResult || !app.$searchHistory || !app.$searchHistoryBody) {
            console.error('couldn\'t target elements');
            return;
        }

        app.$searchInput.addEventListener('keydown', function(e) {
            var keyCode = event.which || event.keyCode;
            var $lis = app.$searchResult.querySelectorAll('li');
            if (keyCode === 13) { //enter key
                if (app.currentFocus !== -1 || !$lis || $lis.indexOf(app.currentFocus) !== -1) {
                    app.addHistory($lis[app.currentFocus].innerHTML);
                }
                return;
            }

            var activeLi = app.$searchResult.querySelector('li.active');
            if (activeLi) {
                activeLi.classList.remove("active");
            }
            if (keyCode === 38) { //up arrow key
                app.currentFocus--;
                if (app.currentFocus === -1) {
                    app.currentFocus = $lis.length;
                    return;
                }
                $lis[app.currentFocus].classList.add("active");
                return;
            }
            if (keyCode === 40) { //down arrow key
                app.currentFocus++;
                if (app.currentFocus >= $lis.length) {
                    app.currentFocus = -1;
                    return;
                }
                $lis[app.currentFocus].classList.add("active");
                return;
            }

            clearTimeout(app.debounceTimeOut);
            app.debounceTimeOut = setTimeout(app.suggestions, 250);
        });
        app.$searchResult.addEventListener('click', function(event) {
            if (event.target.tagName.toLowerCase() !== 'li') {
                return;
            }

            app.addHistory(event.target.innerHTML);
        });
        app.toggleDisplayHistoy();
    },
    addHistory: function(value) {
        var timestamp = new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60 * 1000).toISOString().substr(0, 19).replace('T', ' ');
        app.$searchHistoryBody.innerHTML += app.historyTemplate
            .replace(/\{\{name\}\}/g, value)
            .replace(/\{\{timestamp\}\}/g, timestamp);
        app.clearSuggestions();
        app.toggleDisplayHistoy();
    },
    removeHistory: function(e) {
        if (!e.target) {
            return;
        }

        var $tr = app.findParentEl(e.target, 'row');
        if (!$tr) {
            return;
        }
        $tr.parentNode.removeChild($tr);
        app.toggleDisplayHistoy();
    },
    findParentEl: function(el, cls) {
        while ((el = el.parentElement) && !el.classList.contains(cls));
        return el;
    },
    toggleDisplayHistoy: function() {
        var $trs = app.$searchHistoryBody.querySelector('tr');
        if ($trs) {
            app.$searchHistory.style.display = 'block';
        } else {
            app.$searchHistory.style.display = 'none';
        }
    },
    suggestions: () => {
        if (!app.$searchInput.value.length) {
            app.clearSuggestions();
            return;
        }

        api.get(`https://api.github.com/search/users?q=${app.$searchInput.value}`, function success(data) {
            if (!data || !data.items || !data.items.length) {
                app.clearSuggestions(true);
                return;
            }
            data.items = data.items.slice(0, 5);
            var resultHTML = '';
            data.items.forEach(function(item) {
                resultHTML += `<li>${item.login}</li>`;
            });
            app.$searchResult.innerHTML = resultHTML;
            app.currentFocus = 0;
            var li = app.$searchResult.querySelector('li');
            if (li) {
                li.classList.add('active');
            }
        }, function error(status, data) {
            app.clearSuggestions();
        })
    },
    clearSuggestions: function(isNoResult) {
        app.$searchResult.innerHTML = '';
        app.$searchInput.value = '';
    }
}
app.init();