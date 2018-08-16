const monk = require('monk');
const nock = require('nock');

const { useMongoLogger } = require('../');

jest.mock('monk');

let axios;

function setup() {
  axios = require('axios');

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

it('should parse JSON request body when content-type = application/json', async () => {
  const { collection } = setup();

  nock('https://www.example.com')
    .post('/path')
    .reply(200, { x: 'y' });

  useMongoLogger(axios, {
    mongoURL: 'mongodb://localhost:27017/',
    collectionName: 'logs',
  });

  await axios.post('https://www.example.com/path', {
    x: 1,
    y: 2,
  });

  const record = collection.insert.mock.calls[0][0];

  expect(record.request).toEqual({
    method: 'POST',
    path: '/path',
    headers: {
      accept: 'application/json, text/plain, */*',
      'content-length': 13,
      'content-type': 'application/json;charset=utf-8',
      'user-agent': 'axios/0.18.0',
      host: 'www.example.com',
    },
    query: {},
    body: {
      x: 1,
      y: 2,
    },
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

describe('#allInstances', () => {
  it('should support all instances when allInstances = true', async () => {
    const { collection } = setup();

    nock('https://www.example.com')
      .persist()
      .get('/path')
      .reply(200, { x: 'y' });

    useMongoLogger(axios, {
      mongoURL: 'mongodb://localhost:27017/',
      collectionName: 'logs',
      allInstances: true,
    });

    const axiosInstance = axios.create({ baseURL: 'https://www.example.com' });

    await axios.get('https://www.example.com/path');
    await axiosInstance.get('/path');

    expect(collection.insert).toHaveBeenCalledTimes(2);
  });

  it('should not support all instances when allInstances = false', async () => {
    const { collection } = setup();

    nock('https://www.example.com')
      .get('/path')
      .reply(200, { x: 'y' });

    useMongoLogger(axios, {
      mongoURL: 'mongodb://localhost:27017/',
      collectionName: 'logs',
      allInstances: false,
    });

    const axiosInstance = axios.create({ baseURL: 'https://www.example.com' });

    await axiosInstance.get('/path');

    expect(collection.insert).not.toBeCalled();
  });
});

describe('#transformRequestBody', () => {
  it('should support transform request body', async () => {
    const { collection } = setup();

    nock('https://www.example.com')
      .post('/path')
      .reply(200, { x: 'y' });

    useMongoLogger(axios, {
      mongoURL: 'mongodb://localhost:27017/',
      collectionName: 'logs',
      transformRequestBody: body => ({
        ...body,
        b: 2,
      }),
    });

    await axios.post('https://www.example.com/path', {
      x: 1,
      y: 2,
    });

    const record = collection.insert.mock.calls[0][0];

    expect(record.request.body).toEqual({
      x: 1,
      y: 2,
      b: 2,
    });
  });

  it('should call transformRequestBody with body, { request, config }', async () => {
    const { collection } = setup();

    nock('https://www.example.com')
      .post('/path')
      .reply(200, { x: 'y' });

    const transformRequestBody = jest.fn(body => body);

    useMongoLogger(axios, {
      mongoURL: 'mongodb://localhost:27017/',
      collectionName: 'logs',
      transformRequestBody,
    });

    await axios.post('https://www.example.com/path', {
      x: 1,
      y: 2,
    });

    expect(transformRequestBody).toBeCalledWith(
      {
        x: 1,
        y: 2,
      },
      {
        request: expect.any(Object),
        config: expect.any(Object),
      }
    );
  });
});

describe('#transformResponeBody', () => {
  it('should support transform response body', async () => {
    const { collection } = setup();

    nock('https://www.example.com')
      .post('/path')
      .reply(200, { x: 'y' });

    useMongoLogger(axios, {
      mongoURL: 'mongodb://localhost:27017/',
      collectionName: 'logs',
      transformResponseBody: body => ({
        ...body,
        b: 2,
      }),
    });

    await axios.post('https://www.example.com/path', {
      x: 1,
      y: 2,
    });

    const record = collection.insert.mock.calls[0][0];

    expect(record.response.body).toEqual({
      x: 'y',
      b: 2,
    });
  });

  it('should call transformResponseBody with body, { response, config }', async () => {
    setup();

    nock('https://www.example.com')
      .post('/path')
      .reply(200, { x: 'y' });

    const transformResponseBody = jest.fn(body => body);

    useMongoLogger(axios, {
      mongoURL: 'mongodb://localhost:27017/',
      collectionName: 'logs',
      transformResponseBody,
    });

    await axios.post('https://www.example.com/path', {
      x: 1,
      y: 2,
    });

    expect(transformResponseBody).toBeCalledWith(
      { x: 'y' },
      {
        response: expect.any(Object),
        config: expect.any(Object),
      }
    );
  });
});
