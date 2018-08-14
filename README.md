# axios-logger-mongo

[![npm](https://img.shields.io/npm/v/@yoctol/axios-logger-mongo.svg)](https://www.npmjs.com/package/@yoctol/axios-logger-mongo)

> Mongo logger interceptor for [Axios](https://github.com/axios/axios).

## Installation

Install using npm:

```sh
npm install @yoctol/axios-logger-mongo
```

## API Reference

| Param                 | Type       |                                        |
| --------------------- | ---------- | -------------------------------------- |
| mongoURL              | `String`   | URL of the mongodb.                    |
| collectionName        | `String`   | Name of the collection.                |
| allInstances          | `Boolean`  | Support all of axios instances or not. |
| transformRequestBody  | `Function` | Function to map request body.          |
| transformResponseBody | `Function` | Function to map response body.         |

## Usage

```js
const { useMongoLogger } = require('@yoctol/axios-logger-mongo');

useMongoLogger(axios, {
  mongoURL: 'mongodb://localhost:27017/',
  collectionName: 'logs',
});
```

To support all of axios instances, set option `allInstances` to `true`:

```js
useMongoLogger(axios, {
  mongoURL: 'mongodb://localhost:27017/',
  collectionName: 'logs',
  allInstances: true,
});
```
