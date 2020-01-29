const test = require('ava');
const sinon = require('sinon');
const request = require('supertest');
const { FileUtility } = require('uttori-utilities');
const MulterUpload = require('../src');

test('MulterUpload.register(context): can register', (t) => {
  t.notThrows(() => {
    MulterUpload.register({ hooks: { on: () => {} }, config: { [MulterUpload.configKey]: { events: { callback: [] } } } });
  });
});

test('MulterUpload.register(context): errors without event dispatcher', (t) => {
  t.throws(() => {
    MulterUpload.register({ hooks: {} });
  }, { message: 'Missing event dispatcher in \'context.hooks.on(event, callback)\' format.' });
});

test('MulterUpload.register(context): errors without events', (t) => {
  t.throws(() => {
    MulterUpload.register({ hooks: { on: () => {} }, config: { [MulterUpload.configKey]: { } } });
  }, { message: 'Missing events to listen to for in \'config.events\'.' });
});

test('MulterUpload.defaultConfig(): can return a default config', (t) => {
  t.notThrows(MulterUpload.defaultConfig);
});

test('MulterUpload.validateConfig(config, _context): throws when configuration key is missing', (t) => {
  t.throws(() => {
    MulterUpload.validateConfig({});
  }, { message: 'Config Error: \'uttori-plugin-upload-multer\' configuration key is missing.' });
});

test('MulterUpload.validateConfig(config, _context): throws when directory is not a string', (t) => {
  t.throws(() => {
    MulterUpload.validateConfig({
      [MulterUpload.configKey]: {
        directory: 10,
      },
    });
  }, { message: 'Config Error: `directory` should be a string path to where files should be stored.' });
});

test('MulterUpload.validateConfig(config, _context): throws when route is not a string', (t) => {
  t.throws(() => {
    MulterUpload.validateConfig({
      [MulterUpload.configKey]: {
        directory: 'uploads',
        route: 10,
      },
    });
  }, { message: 'Config Error: `route` should be a string server route to where files should be POSTed to.' });
});

test('MulterUpload.validateConfig(config, _context): can validate', (t) => {
  t.notThrows(() => {
    MulterUpload.validateConfig({
      [MulterUpload.configKey]: {
        directory: 'uploads',
        route: '/upload',
      },
    });
  });
});

test('MulterUpload.bindRoutes(server, context): can bind routes', (t) => {
  const use = sinon.spy();
  const post = sinon.spy();
  const server = { use, post };
  MulterUpload.bindRoutes(server, {
    config: {
      [MulterUpload.configKey]: {
        directory: 'uploadz',
        route: '/up-load',
      },
    },
  });
  t.true(use.calledOnce);
  t.true(post.calledOnce);
});

test('MulterUpload.upload(context): returns a Express route and can upload files and returns the filename', async (t) => {
  t.plan(2);
  const { serverSetup } = require('./_helpers/server.js');
  const route = '/upload';
  const context = {
    config: {
      [MulterUpload.configKey]: {
        directory: 'uploads',
        route,
      },
    },
  };
  const server = serverSetup();
  MulterUpload.bindRoutes(server, context);
  const response = await request(server).post(route).attach('file', 'test/_helpers/am-i-human.png');
  t.is(response.status, 200);
  t.is(response.text.slice(0, 10), 'am-i-human');
});
