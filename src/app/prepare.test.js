const prepareData = require('./prepare').default;
const rawData = require('../data/input.json');
const sample = require('../data/sample.json');

console.time('prepare');
const data = prepareData(rawData, { sprintId: 977 });
console.timeEnd('prepare');
console.time('empty');
const emptySprintData = prepareData(rawData, { sprintId: 996 });
console.timeEnd('empty');

console.log(JSON.stringify(data));

test('passes smoke test', () => {
  expect(data).toBeTruthy();
});

test('returns an array of 5', () => {
  expect(data.length).toBe(5);
});

describe.each([
  [ data[0].alias, sample[0].alias ],
  [ data[1].alias, sample[1].alias ],
  [ data[2].alias, sample[2].alias ],
  [ data[3].alias, sample[3].alias ],
  [ data[4].alias, sample[4].alias ]
])('alias', (fact, expected) => {
  test(`contains alias ${expected}`, () => {
    expect(fact).toEqual(expected);
  })
});

describe.each([
  [ data[0].alias, data[0].data.title, sample[0].data.title ],
  [ data[1].alias, data[1].data.title, sample[1].data.title ],
  [ data[2].alias, data[2].data.title, sample[2].data.title ],
  [ data[3].alias, data[3].data.title, sample[3].data.title ],
  [ data[4].alias, data[4].data.title, sample[4].data.title ]
])('title', (alias, fact, expected) => {
  test(`${alias} title is ${expected}`, () => {
    expect(fact).toEqual(expected);
  })
});

describe.each([
  [ data[0].alias, data[0].data.subtitle, sample[0].data.subtitle ],
  [ data[1].alias, data[1].data.subtitle, sample[1].data.subtitle ],
  [ data[2].alias, data[2].data.subtitle, sample[2].data.subtitle ],
  [ data[3].alias, data[3].data.subtitle, sample[3].data.subtitle ],
  [ data[4].alias, data[4].data.subtitle, sample[4].data.subtitle ]
])('subtitle', (alias, fact, expected) => {
  test(`${alias} subtitle is ${expected}`, () => {
    expect(fact).toEqual(expected);
  })
});

describe.each([
  [ data[0].alias, data[0].data, 'users' ],
  [ data[1].alias, data[1].data, 'users' ],
  [ data[2].alias, data[2].data, 'users' ],
  [ data[2].alias, data[2].data, 'values' ],
  [ data[3].alias, data[3].data, 'categories' ],
  [ data[4].alias, data[4].data, 'data' ]
])('data', (alias, fact, prop) => {
  test(`${alias} has ${prop}`, () => {
    expect(fact).toHaveProperty(prop);
  })
});

describe.each([
  [ emptySprintData[0].data.title],
  [ emptySprintData[1].data.title],
  [ emptySprintData[2].data.title],
  [ emptySprintData[3].data.title],
  [ emptySprintData[4].data.title]
])('returns title on empty sprint', (fact) => {
  test('return title', () => {
    expect(fact).toBeTruthy();
  })
});

describe.each([
  [ emptySprintData[0].data.subtitle],
  [ emptySprintData[1].data.subtitle],
  [ emptySprintData[2].data.subtitle],
  [ emptySprintData[3].data.subtitle],
  [ emptySprintData[4].data.subtitle]
])('returns subtitle on empty sprint', (fact) => {
  test('return subtitle', () => {
    // expect(fact).toBeGreaterThan(0);
    expect(fact).toEqual('Бармалей');
  })
});

describe.each([
  [ emptySprintData[0].data, 'users' ],
  [ emptySprintData[1].data, 'users' ],
  [ emptySprintData[2].data, 'users' ],
  [ emptySprintData[2].data, 'values' ],
  [ emptySprintData[3].data, 'categories' ],
  [ emptySprintData[4].data, 'data' ]
])('returns data on empty sprint', (fact, prop) => {
  test(`has ${prop}`, () => {
    expect(fact).toHaveProperty(prop);
  })
});

describe.each([
  [ data[0].alias, data[0].data.users, sample[0].data.users],
  [ data[1].alias, data[1].data.users, sample[1].data.users],
  [ data[2].alias, data[2].data.users, sample[2].data.users]
])('users match sample', (alias, fact, expected) => {
  test(`length in ${alias} matches sample`, () => {
    expect(fact.length).toEqual(expected.length);
  });

  test(`stringified users in ${alias} match sample`, () => {
    expect(JSON.stringify(fact)).toEqual(JSON.stringify(expected));
  });
});

test(`values length in chart matches sample`, () => {
  expect(data[2].data.values.length).toEqual(sample[2].data.values.length);
});

test(`stringified values in chart match sample`, () => {
  expect(JSON.stringify(data[2].data.values)).toEqual(JSON.stringify(sample[2].data.values))
});

test('diagram has 4 categories', () => {
  expect(data[3].data.categories.length).toEqual(4);
});

test('diagram value text matches sample', () => {
  expect(data[3].data.totalText).toEqual(sample[3].data.totalText);
});

test('diagram difference text matches sample', () => {
  expect(data[3].data.differenceText).toEqual(sample[3].data.differenceText);
});

test('diagram categories match sample', () => {
  expect(JSON.stringify(data[3].data.categories)).toEqual(JSON.stringify(sample[3].data.categories));
});

test('activity data has 7 days of the week 24 hours each', () => {
  const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  days.forEach(day => {
    expect(data[4].data.data).toHaveProperty(day);
    expect(data[4].data.data[day]).toHaveLength(24);
  });
});

test('activity data matches sample', () => {
  expect(JSON.stringify(data[4].data.data)).toEqual(JSON.stringify(sample[4].data.data));
});
