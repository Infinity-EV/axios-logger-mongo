# axios-logger-mongo

> Mongo logger interceptor for [Axios](https://github.com/axios/axios).

## Installation

Install using npm:

```sh
npm install @yoctol/axios-logger-mongo
```

## Usage

```js
const { useMongoLogger } = require('@yoctol/axios-logger-mongo');

useMongoLogger(axios, {
  mongoURL: 'mongodb://localhost:27017/',
  collectionName: 'logs',
});
```
