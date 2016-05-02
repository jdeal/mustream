import test from 'ava';
import sinon from 'sinon';

import 'babel-core/register';

import createStream from 'mustream/src/createStream';

test('create a new stream', t => {
  const stream = createStream();
  t.truthy(stream);
  t.is(typeof stream, 'object');
  t.not(typeof stream, 'function');
});

test('default value of stream is null', t => {
  const stream = createStream();
  t.is(stream.get(), null);
});

test('can set the value of a stream', t => {
  const stream = createStream();
  stream.set([], 1);
  t.is(stream.get(), 1);
});

test('can listen to changes in value', t => {
  const stream = createStream();
  const spy = sinon.spy();
  stream.subscribe(spy);
  stream.set([], 1);
  t.true(spy.called);
  t.is(spy.lastCall.args[0], 1);
});

test('can set a nested value of a stream', t => {
  const stream = createStream();
  stream.set([], {});
  stream.set(['counter'], 1);
  t.deepEqual(stream.get(), {counter: 1});
});

test('can get a nested value of a stream', t => {
  const stream = createStream();
  stream.set([], {});
  stream.set(['counter'], 1);
  t.is(stream.get('counter'), 1);
});

test('can listen to changes in a nested value', t => {
  const stream = createStream();
  stream.set([], {x: 1});
  const spy = sinon.spy();
  stream.at('x').subscribe(spy);
  stream.set('y', 2);
  t.false(spy.called);
  stream.set('x', 2);
  t.true(spy.called);
});
