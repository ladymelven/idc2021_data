import { Comment, Commit, Entity, Sprint, Summary, User } from '../types/types';

function memoize(func: Function) {
  const cache = new Map();

  //здесь any, потому что я планирую оборачивать функции с разными аргументами, это реально any
  return (...args: any) => {
    if (cache.has(args)) {
      return cache.get(args);
    }

    const result = func(...args);
    cache.set(args, result);
    return result;
  };
}

export function sortData(entities: Entity[]) {
  //мы работаем только с этими сущностями, issues и projects нам не нужны
  //будут нужны, их легко сюда добавить
  const users: User[] = [];
  const comments: Comment[] = [];
  const commits: Commit[] = [];
  const summaries: Summary[] = [];
  const sprints: Sprint[] = [];

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
      //no-default
    }
  });

  return { users, comments, commits, summaries, sprints };
}

function baseFilterCommitsBySprint(commits: Commit[], sprint: Sprint) {
  return commits.filter((commit) => {
    return commit.timestamp >= sprint.startAt && commit.timestamp <= sprint.finishAt;
  });
}
export const filterCommitsBySprint = memoize(baseFilterCommitsBySprint);

export function filterData(
  data: {
    users: User[],
    comments: Comment[],
    commits: Commit[],
    summaries: Summary[],
    sprints: Sprint[]
  },
  id: number
) {
  //вообще по среднему времени лучше было бы find, но type checker боится получить undefined
  const currSprint = data.sprints.filter(sprint => sprint.id === id)[0];

  const filteredComments = data.comments.filter(comment => {
    return comment.createdAt > currSprint.startAt && comment.createdAt <= currSprint.finishAt;
  });
  const filteredCommits = filterCommitsBySprint(data.commits, currSprint);

  return { comments: filteredComments, commits: filteredCommits, sprint: currSprint };
}

export function setWordEnding(num: number, variants: Array<string>) {
  if (num % 100 === 1 || (num % 100 > 20 && num % 10 === 1)) {
    return variants[0];
  } if ((num % 100 !== 0 && num % 100 < 5) ||
    (num % 100 > 20 && (num % 10) !== 0 && (num % 10) < 5)
  ) {
    return variants[1];
  }
  return variants[2];
}

function baseGetAuthorId(unit: Comment | Commit) {
  if (typeof unit.author === 'number') {
    return unit.author;
  } if (unit.author.id) {
    return unit.author.id;
  }
}
const getAuthorId = memoize(baseGetAuthorId);

function baseFilterByUser(data: Commit[] | Comment[], id: number) {
  // @ts-ignore
  return data.filter((unit: Commit | Comment) => getAuthorId(unit) === id);
}
export const filterByUser = memoize(baseFilterByUser);
