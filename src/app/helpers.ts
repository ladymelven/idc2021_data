import { Comment, Commit, Entity, Sprint, Summary, User } from '../types/types';

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
    }
  })

  return { users, comments, commits, summaries, sprints };
}

export function filterCommitsBySprint(commits: Commit[], sprint: Sprint) {
  return commits.filter((commit) => {
    return commit.timestamp >= sprint.startAt && commit.timestamp <= sprint.finishAt;
  });
}

export function filterData(
  data: {
    users: User[],
    comments: Comment[],
    commits: Commit[],
    summaries: Summary[],
    sprints: Sprint[]
  },
  id: number,
) {
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

export function setWordEnding(num: number, variants: Array<string>) {
  if (num === 1) {
    return variants[0];
  } if (num !== 0 && (num < 5 || (num > 20 && (num % 10) !== 0 && (num % 10) < 5))) {
    return variants[1];
  }
  return variants[2];
}

export function getAuthorId(unit: Comment | Commit) {
  if (typeof unit.author === 'number') {
    return unit.author;
  } if (unit.author.hasOwnProperty('id')) {
    return unit.author.id;
  }
}

export function filterByUser(data: Commit[] | Comment[], id: number) {
  // @ts-ignore
  return data.filter((unit: Commit | Comment) => getAuthorId(unit) === id);
}
