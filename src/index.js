const { URL } = require('url');
const qs = require('querystring');

const monk = require('monk');
const mapKeys = require('lodash/mapKeys');

const NAMESPACE = 'axios-logger-mongo';

const logRequest = () => axiosConfig => {
  axiosConfig[NAMESPACE] = Object.assign(
    { requestTimestamp: Date.now() },
    axiosConfig[NAMESPACE]
  );
  return axiosConfig;
};

const logResponse = collection => axiosResponse => {
  const axiosConfig = axiosResponse.config;
  const axiosRequest = axiosResponse.request;

  const { requestTimestamp } = axiosConfig[NAMESPACE];
  const responseTimestamp = Date.now();

  const url = new URL(axiosConfig.url);

  const request = {
    method: axiosRequest.method || axiosConfig.method.toUpperCase(),
    path: axiosRequest.path,
    headers: {
      host: url.host,
      ...mapKeys(axiosConfig.headers, (val, key) => key.toLowerCase()),
    },
    query: {
      ...qs.parse(url.search.replace('?', '')),
      ...axiosConfig.params,
    },
    body: axiosConfig.data || null,
  };

  const response = {
    status: axiosResponse.status,
    statusText: axiosResponse.statusText,
    headers: axiosResponse.headers,
    body: axiosResponse.data || null,
  };

  const error = null;

  collection.insert({
    request,
    response,
    error,
    time: responseTimestamp - requestTimestamp,
  });

  return axiosResponse;
};

const logError = collection => axiosError => {
  const axiosConfig = axiosError.config;
  const axiosRequest = axiosError.request;

  const { requestTimestamp } = axiosConfig[NAMESPACE];
  const errorTimestamp = Date.now();

  const url = new URL(axiosConfig.url);

  const request = {
    method: axiosRequest.method || axiosConfig.method.toUpperCase(),
    path: axiosRequest.path || url.pathname,
    headers: {
      host: url.host,
      ...mapKeys(axiosConfig.headers, (val, key) => key.toLowerCase()),
    },
    query: {
      ...qs.parse(url.search.replace('?', '')),
      ...axiosConfig.params,
    },
    body: axiosConfig.data || null,
  };
  const response = null;

  const error = axiosError.message;

  collection.insert({
    request,
    response,
    error,
    time: errorTimestamp - requestTimestamp,
  });

  return Promise.reject(axiosError);
};

function useMongoLogger(axios, { mongoURL, collectionName }) {
  const db = monk(mongoURL);

  const collection = db.get(collectionName);

  axios.interceptors.request.use(logRequest(collection));
  axios.interceptors.response.use(
    logResponse(collection),
    logError(collection)
  );
}

module.exports = {
  useMongoLogger,
};
