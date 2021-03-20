import {
  Comment, Commit, Entity, Sprint, Summary, User,
} from '../types/types';
import * as stories from '../types/stories';
import {
  sortData,
  filterByUser,
  filterData,
  filterCommitsBySprint,
  setWordEnding
} from './helpers';

function rankUsers(users: User[],
                   commits: Commit[],
                   comments: Comment[],
                   identifier: 'commits' | 'likes',
                   stopper?: number) {
  let text = '';
  let endings = ['', 'а', 'ов'];
  let map: { id: number, frequency: number }[] = [];

  switch (identifier) {
    case 'commits':
      map = users.map((user) => {
        return {
          id: user.id,
          frequency: filterByUser(commits, user.id).length,
        };
      });
      text = '';
      endings = ['', '', ''];
      break;
    case 'likes':
      map = users.map((user) => {
        const userComments = filterByUser(comments, user.id);
        const likes = userComments.map((comment: Comment) => {
          return comment.likes.length;
        });
        return {
          id: user.id,
          frequency: likes.reduce((a: number, b: number) => a + b, 0)
        };
      });
      text = ' голос';
      break;
    //no-default
  }

  const ranked = map.sort((unit1, unit2) => {
    if (unit1.frequency !== unit2.frequency) {
      return unit2.frequency - unit1.frequency;
    } else {
      return unit1.id - unit2.id;
    }
  });
  let slice;

  if (stopper) {
    slice = ranked.slice(0, stopper);
  } else {
    slice = ranked;
  }

  return slice.map((unit) => {
    const { name, avatar } = users.filter((user) => unit.id === user.id)[0];
    const userText = unit.frequency + text + setWordEnding(unit.frequency, endings);
    return {
      id: unit.id,
      name,
      avatar,
      valueText: userText
    };
  });
}

function prepareChart(commits: Commit[], sprints: Sprint[], activeId: number) {
  const sortedSprints = sprints.sort((sprint1, sprint2) => {
    return sprint1.id - sprint2.id;
  });

  return sortedSprints.map((sprint) => {
    const sprintInfo: { title: string, hint: string, value: number, active?: boolean } = {
      title: sprint.id.toString(10),
      hint: sprint.name,
      value: filterCommitsBySprint(commits, sprint).length
    }

    if (sprint.id === activeId) { sprintInfo.active = true }

    return sprintInfo;
  });
}

function getBreakdown(commits: Commit[], summaries: Summary[], limits: Array<number>) {
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
      } else {
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
      } else if (!limits[i]) {
        values[values.length - 1]++;
      }
    }
  });

  return values;
}

function prepareDiagram(currentCommits: Commit[], prevCommits: Commit[], summaries: Summary[]) {
  const currentValue = currentCommits.length;
  const differenceSign = currentValue > prevCommits.length ? '+' : '-';
  let differenceText: string;

  if (currentValue !== prevCommits.length) {
    differenceText = `${differenceSign}${Math.abs(currentValue - prevCommits.length)} с прошлого спринта`;
  } else {
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
    } else {
      diffText = '==';
    }

    if (higher) {
      title = `${lower} — ${higher} строк${setWordEnding(higher, ['а', 'и', ''])}`;
    } else {
      title = `> ${lower} строк${setWordEnding(lower, ['а', 'и', ''])}`;
    }

    //потенциально дорогая операция, но у нас же никогда не будет много категорий?
    categories.unshift({
      title,
      valueText: `${value} коммит${setWordEnding(value, ['', 'а', 'ов'])}`,
      differenceText: diffText
    });
  }

  return {
    totalText: `${currentValue} коммит${setWordEnding(currentValue, ['', 'а', 'ов'])}`,
    differenceText,
    categories
  };
}

function prepareActivity(commits: Commit[]) {
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
      heatmap[key].push(0) }
  }

  commits.forEach(commit => {
    const datetime = new Date(commit.timestamp);
    const dayName = dayNames[datetime.getDay()];
    // @ts-ignore
    heatmap[dayName][datetime.getHours()]++;
  });

  return heatmap;
}


export default function prepareData(entities: Entity[], identifier: { sprintId: number }): stories.StoryData {
  //сначала раскидываем дату по типам, чтобы не проходиться каждый раз по всему массиву
  const sorted = sortData(entities);
  //потом сортируем то, что относится к текущему спринту (заодно получаем текущий спринт)
  const filtered = filterData(sorted, identifier.sprintId);
  const prevSprint = sorted.sprints.filter(sprint => sprint.id === identifier.sprintId - 1)[0];
  const currentRank = rankUsers(sorted.users, filtered.commits, filtered.comments, 'commits');

  return [
    {
      alias: 'leaders',
      data: {
        title: 'Больше всего коммитов',
        subtitle: filtered.sprint.name,
        emoji: '👑',
        users: currentRank
      }
    },
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
      alias: 'chart',
      data: {
        title: 'Коммиты',
        subtitle: filtered.sprint.name,
        values: prepareChart(sorted.commits, sorted.sprints, filtered.sprint.id),
        users: currentRank
      }
    },
    {
      alias: 'diagram',
      data: {
        title: 'Размер коммитов',
        subtitle: filtered.sprint.name,
        ...prepareDiagram(
          filtered.commits,
          filterCommitsBySprint(sorted.commits, prevSprint),
          sorted.summaries
        )
      }
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
