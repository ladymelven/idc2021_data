/******/ "use strict";
/******/ var __webpack_modules__ = ({

/***/ 766:
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.filterByUser = exports.getAuthorId = exports.setWordEnding = exports.filterData = exports.filterCommitsBySprint = exports.sortData = void 0;
function sortData(entities) {
    //мы работаем только с этими сущностями, issues и projects нам не нужны
    //будут нужны, их легко сюда добавить
    const users = [];
    const comments = [];
    const commits = [];
    const summaries = [];
    const sprints = [];
    //раскидываем за одну проходку; на сложность не влияет, но входной массив большой
    entities.forEach(entity => {
        switch (entity.type) {
            case 'User':
                users.push(entity);
                break;
            case 'Comment':
                comments.push(entity);
                break;
            case 'Commit':
                commits.push(entity);
                break;
            case 'Summary':
                summaries.push(entity);
                break;
            case 'Sprint':
                sprints.push(entity);
                break;
        }
    });
    return { users, comments, commits, summaries, sprints };
}
exports.sortData = sortData;
function filterCommitsBySprint(commits, sprint) {
    return commits.filter((commit) => {
        return commit.timestamp >= sprint.startAt && commit.timestamp <= sprint.finishAt;
    });
}
exports.filterCommitsBySprint = filterCommitsBySprint;
function filterData(data, id) {
    //вообще по среднему времени лучше было бы find, но type checker боится получить undefined
    const sprint = data.sprints.filter((sprint) => sprint.id === id)[0];
    const filteredComments = data.comments.filter((comment) => {
        //чтобы не впилиться в ошибки при сравнении Integer и Float, округляем
        return Math.floor(comment.createdAt) >= sprint.startAt &&
            Math.floor(comment.createdAt) <= sprint.finishAt;
    });
    const filteredCommits = filterCommitsBySprint(data.commits, sprint);
    return { comments: filteredComments, commits: filteredCommits, sprint };
}
exports.filterData = filterData;
function setWordEnding(num, variants) {
    if (num === 1) {
        return variants[0];
    }
    if (num !== 0 && (num < 5 || (num > 20 && (num % 10) !== 0 && (num % 10) < 5))) {
        return variants[1];
    }
    return variants[2];
}
exports.setWordEnding = setWordEnding;
function getAuthorId(unit) {
    if (typeof unit.author === 'number') {
        return unit.author;
    }
    if (unit.author.hasOwnProperty('id')) {
        return unit.author.id;
    }
}
exports.getAuthorId = getAuthorId;
function filterByUser(data, id) {
    // @ts-ignore
    return data.filter((unit) => getAuthorId(unit) === id);
}
exports.filterByUser = filterByUser;


/***/ }),

/***/ 936:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

var __webpack_unused_export__;

__webpack_unused_export__ = ({ value: true });
const helpers_1 = __webpack_require__(766);
function rankUsers(users, commits, comments, identifier, stopper) {
    let text = '';
    let endings = ['', 'а', 'ов'];
    let map = [];
    switch (identifier) {
        case 'commits':
            map = users.map((user) => ({
                id: user.id,
                frequency: helpers_1.filterByUser(commits, user.id).length,
            }));
            text = '';
            endings = ['', '', ''];
            break;
        case 'likes':
            map = users.map((user) => {
                const userComments = helpers_1.filterByUser(comments, user.id);
                const likes = userComments.map((comment) => {
                    return comment.likes.length;
                });
                return {
                    id: user.id,
                    frequency: likes.reduce((a, b) => a + b, 0)
                };
            });
            text = ' голос';
            break;
        //no-default
    }
    const ranked = map.sort((unit1, unit2) => {
        return unit2.frequency - unit1.frequency;
    });
    let slice;
    if (stopper) {
        slice = ranked.slice(0, stopper);
    }
    else {
        slice = ranked;
    }
    return slice.map((unit) => {
        const { name, avatar } = users.filter((user) => unit.id === user.id)[0];
        const userText = unit.frequency + text + helpers_1.setWordEnding(unit.frequency, endings);
        return {
            id: unit.id,
            name,
            avatar,
            valueText: userText
        };
    });
}
function prepareChart(commits, sprints, activeId) {
    const sortedSprints = sprints.sort((sprint1, sprint2) => {
        return sprint1.id - sprint2.id;
    });
    return sortedSprints.map((sprint) => {
        const sprintInfo = {
            title: sprint.id.toString(10),
            hint: sprint.name,
            value: helpers_1.filterCommitsBySprint(commits, sprint).length
        };
        if (sprint.id === activeId) {
            sprintInfo.active = true;
        }
        return sprintInfo;
    });
}
function getBreakdown(commits, summaries, limits) {
    const values = [0];
    // у нас 4 категории, но ничто не мешает разбить на любое другое количество
    for (let i = 0; i < limits.length; i++) {
        values.push(0);
    }
    commits.forEach(commit => {
        let size = 0;
        commit.summaries.forEach((summary) => {
            if (typeof summary === 'object') {
                size += summary.added;
                size += summary.removed;
            }
            else {
                const summaryObj = summaries.filter(unit => unit.id === summary)[0];
                size += summaryObj.added;
                size += summaryObj.removed;
            }
        });
        // проверяем, под какой из лимитов попадает размер коммита; если больше самого большого, записываем в конец
        for (let i = 0; i <= limits.length; i++) {
            if (limits[i] && size <= limits[i]) {
                values[i]++;
                break;
            }
            else if (!limits[i]) {
                values[values.length - 1]++;
            }
        }
    });
    return values;
}
function prepareDiagram(currentCommits, prevCommits, summaries) {
    const currentValue = currentCommits.length;
    const differenceSign = currentValue > prevCommits.length ? '+' : '-';
    let differenceText;
    if (currentValue !== prevCommits.length) {
        differenceText = `${differenceSign}${Math.abs(currentValue - prevCommits.length)} с прошлого спринта`;
    }
    else {
        differenceText = 'как и в прошлом спринте';
    }
    const limits = [100, 500, 1000];
    const currentValues = getBreakdown(currentCommits, summaries, limits);
    const prevValues = getBreakdown(prevCommits, summaries, limits);
    const categories = [];
    for (let i = 0; i <= limits.length; i++) {
        const lower = limits[i - 1] ? limits[i - 1] + 1 : 1;
        const higher = limits[i] ? limits[i] : null;
        let title = '';
        let diffText = '';
        const value = currentValues[i];
        const prevValue = prevValues[i];
        const diffSign = value > prevValue ? '+' : '-';
        // может быть краевой случай, когда одинаково по размерам в текущем и прошлом, тогда ставлю '=='
        if (currentValue !== prevValue) {
            diffText = `${diffSign}${Math.abs(value - prevValue)}`;
        }
        else {
            diffText = '==';
        }
        if (higher) {
            title = `${lower} — ${higher} строк${helpers_1.setWordEnding(higher, ['а', 'и', ''])}`;
        }
        else {
            title = `> ${lower} строк${helpers_1.setWordEnding(lower, ['а', 'и', ''])}`;
        }
        //потенциально дорогая операция, но у нас же никогда не будет много категорий?
        categories.unshift({
            title,
            valueText: `${value} коммит${helpers_1.setWordEnding(value, ['', 'а', 'ов'])}`,
            differenceText: diffText
        });
    }
    return {
        totalText: `${currentValue} коммит${helpers_1.setWordEnding(currentValue, ['', 'а', 'ов'])}`,
        differenceText,
        categories
    };
}
function prepareActivity(commits) {
    const dayNames = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    const heatmap = {
        sun: [],
        mon: [],
        tue: [],
        wed: [],
        thu: [],
        fri: [],
        sat: []
    };
    for (let key in heatmap) {
        for (let i = 0; i < 24; i++) { // @ts-ignore
            heatmap[key].push(0);
        }
    }
    commits.forEach(commit => {
        const datetime = new Date(commit.timestamp);
        const dayName = dayNames[datetime.getDay()];
        // @ts-ignore
        heatmap[dayName][datetime.getHours()]++;
    });
    return heatmap;
}
function prepareData(entities, identifier) {
    //сначала раскидываем дату по типам, чтобы не проходиться каждый раз по всему массиву
    const sorted = helpers_1.sortData(entities);
    //потом сортируем то, что относится к текущему спринту (заодно получаем текущий спринт)
    const filtered = helpers_1.filterData(sorted, identifier.sprintId);
    const prevSprint = sorted.sprints.filter(sprint => sprint.id === identifier.sprintId - 1)[0];
    return [
        {
            alias: 'vote',
            data: {
                title: 'Самый 🔎 внимательный разработчик',
                subtitle: filtered.sprint.name,
                emoji: '🔎',
                users: rankUsers(sorted.users, filtered.commits, filtered.comments, 'likes')
            }
        },
        {
            alias: 'leaders',
            data: {
                title: 'Больше всего коммитов',
                subtitle: filtered.sprint.name,
                emoji: '👑',
                users: rankUsers(sorted.users, filtered.commits, filtered.comments, 'commits')
            }
        },
        {
            alias: 'chart',
            data: {
                title: 'Коммиты',
                subtitle: filtered.sprint.name,
                values: prepareChart(sorted.commits, sorted.sprints, filtered.sprint.id),
                users: rankUsers(sorted.users, filtered.commits, filtered.comments, 'commits', 3)
            }
        },
        {
            alias: 'diagram',
            data: Object.assign({ title: 'Размер коммитов', subtitle: filtered.sprint.name }, prepareDiagram(filtered.commits, helpers_1.filterCommitsBySprint(sorted.commits, prevSprint), sorted.summaries))
        },
        {
            alias: 'activity',
            data: {
                title: 'Коммиты, 1 неделя',
                subtitle: filtered.sprint.name,
                data: prepareActivity(filtered.commits)
            }
        }
    ];
}
exports.Z = prepareData;


/***/ }),

/***/ 303:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {


const prepareData = __webpack_require__(936)/* .default */ .Z;
// const data = require('./data/input.json');
// console.time('func');
// console.log(prepareData(data, { sprintId: 977 }));
// console.timeEnd('func');
module.exports = { prepareData };


/***/ })

/******/ });
/************************************************************************/
/******/ // The module cache
/******/ var __webpack_module_cache__ = {};
/******/ 
/******/ // The require function
/******/ function __webpack_require__(moduleId) {
/******/ 	// Check if module is in cache
/******/ 	var cachedModule = __webpack_module_cache__[moduleId];
/******/ 	if (cachedModule !== undefined) {
/******/ 		return cachedModule.exports;
/******/ 	}
/******/ 	// Create a new module (and put it into the cache)
/******/ 	var module = __webpack_module_cache__[moduleId] = {
/******/ 		// no module.id needed
/******/ 		// no module.loaded needed
/******/ 		exports: {}
/******/ 	};
/******/ 
/******/ 	// Execute the module function
/******/ 	__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 
/******/ 	// Return the exports of the module
/******/ 	return module.exports;
/******/ }
/******/ 
/************************************************************************/
/******/ 
/******/ // startup
/******/ // Load entry module and return exports
/******/ // This entry module is referenced by other modules so it can't be inlined
/******/ var __webpack_exports__ = __webpack_require__(303);
/******/ 
