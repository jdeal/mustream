import test from 'ava';

import 'babel-core/register';

import * as mustream from 'mustream/src';

test('mustream.createStream is a function', t => {
  t.is(typeof mustream.createStream, 'function');
});
