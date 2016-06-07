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
  const rootSpy = sinon.spy();
  const xSpy = sinon.spy();
  stream.subscribe(rootSpy);
  stream.at('x').subscribe(xSpy);
  stream.set('y', 2);
  t.true(rootSpy.called);
  t.false(xSpy.called);
  stream.set('x', 2);
  t.true(xSpy.called);
});

test('can autoSubscribe to changes', t => {
  const stream = createStream();
  stream.set([], {x: 1, y: 2});
  const spy = sinon.spy();
  stream.autoSubscribe(get => spy(get('x')));
  t.true(spy.called);
  t.true(spy.calledWith(1));
  stream.set('x', 2);
  t.is(spy.callCount, 2);
  t.true(spy.calledWith(2));
  stream.set('y', 3);
  t.is(spy.callCount, 2);
});
