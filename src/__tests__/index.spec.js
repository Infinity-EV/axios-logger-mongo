const axios = require('axios');
const monk = require('monk');
const nock = require('nock');

const { useMongoLogger } = require('../');

jest.mock('monk');

function setup() {
  const db = {
    get: jest.fn(),
  };
  monk.mockReturnValue(db);

  const collection = {
    insert: jest.fn(),
  };
  db.get.mockReturnValue(collection);

  return {
    collection,
  };
}

afterEach(() => {
  nock.cleanAll();
});

it('should support axios', async () => {
  const { collection } = setup();

  nock('https://www.example.com')
    .get('/path')
    .reply(200, { x: 'y' });

  useMongoLogger(axios, {
    mongoURL: 'mongodb://localhost:27017/',
    collectionName: 'logs',
  });

  await axios.get('https://www.example.com/path');

  const record = collection.insert.mock.calls[0][0];

  expect(record.request).toEqual({
    method: 'GET',
    path: '/path',
    headers: {
      accept: 'application/json, text/plain, */*',
      'user-agent': 'axios/0.18.0',
      host: 'www.example.com',
    },
    query: {},
    body: null,
  });
  expect(record.response).toEqual({
    status: 200,
    statusText: null,
    headers: {
      'content-type': 'application/json',
    },
    body: {
      x: 'y',
    },
  });
  expect(record.error).toBeNull();
  expect(record.time).toEqual(expect.any(Number));
});

it('should work on error', async () => {
  const { collection } = setup();

  nock('https://www.example.com')
    .get('/path')
    .replyWithError('something awful happened');

  useMongoLogger(axios, {
    mongoURL: 'mongodb://localhost:27017/',
    collectionName: 'logs',
  });
  try {
    await axios.get('https://www.example.com/path');
  } catch (_) {} // eslint-disable-line

  const record = collection.insert.mock.calls[0][0];

  expect(record.request).toEqual({
    method: 'GET',
    path: '/path',
    headers: {
      accept: 'application/json, text/plain, */*',
      'user-agent': 'axios/0.18.0',
      host: 'www.example.com',
    },
    query: {},
    body: null,
  });
  expect(record.response).toBeNull();
  expect(record.error).toEqual('something awful happened');
  expect(record.time).toEqual(expect.any(Number));
});

it('should support axios.create', async () => {
  const { collection } = setup();

  nock('https://www.example.com')
    .get('/path')
    .reply(200, { x: 'y' });

  const axiosInstance = axios.create({ baseURL: 'https://www.example.com' });
  useMongoLogger(axiosInstance, {
    mongoURL: 'mongodb://localhost:27017/',
    collectionName: 'logs',
  });

  await axiosInstance.get('/path');

  const record = collection.insert.mock.calls[0][0];

  expect(record.request).toEqual({
    method: 'GET',
    path: '/path',
    headers: {
      accept: 'application/json, text/plain, */*',
      'user-agent': 'axios/0.18.0',
      host: 'www.example.com',
    },
    query: {},
    body: null,
  });
  expect(record.response).toEqual({
    status: 200,
    statusText: null,
    headers: {
      'content-type': 'application/json',
    },
    body: {
      x: 'y',
    },
  });
  expect(record.error).toBeNull();
  expect(record.time).toEqual(expect.any(Number));
});
