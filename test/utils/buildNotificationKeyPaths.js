import test from 'ava';

import 'babel-core/register';

import buildNotificationKeyPaths from 'mustream/src/utils/buildNotificationKeyPaths';

test('root key path', t => {
  const keyPaths = buildNotificationKeyPaths();
  t.deepEqual(keyPaths, [
    ''
  ]);
});

test('blank key path', t => {
  const keyPaths = buildNotificationKeyPaths('');
  t.deepEqual(keyPaths, [
    ''
  ]);
});

test('x key path', t => {
  const keyPaths = buildNotificationKeyPaths('x');
  t.deepEqual(keyPaths, [
    '',
    "['x']"
  ]);
});

test('x.y key path', t => {
  const keyPaths = buildNotificationKeyPaths('x.y');
  t.deepEqual(keyPaths, [
    '',
    "['x']",
    "['x']['y']",
  ]);
});
