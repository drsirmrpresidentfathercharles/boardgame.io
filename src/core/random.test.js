/*
 * Copyright 2017 The boardgame.io Authors
 *
 * Use of this source code is governed by a MIT-style
 * license that can be found in the LICENSE file or at
 * https://opensource.org/licenses/MIT.
 */

import { Random } from './random';
import Game from './game';
import { makeMove } from './action-creators';
import { CreateGameReducer } from './reducer';

function Init(seed) {
  const ctx = { _random: { seed } };
  return new Random(ctx);
}

test('constructor', () => {
  const r = new Random({});
  expect(r.state).toEqual({ seed: '0' });
});

test('attach / detach / update', () => {
  const r = new Random({});
  const ctx = r.attach({});

  expect(ctx._random).not.toBeDefined();
  expect(ctx.random).toBeDefined();

  {
    const t = Random.detach(ctx);
    expect(t._random).not.toBeDefined();
    expect(t.random).not.toBeDefined();
  }

  {
    const t = r.update(ctx);
    expect(t._random).toBeDefined();
    expect(t.random).toBeDefined();
  }
});

test('random', () => {
  const r = Init('hi there');
  // make sure that subsequent calls are different.
  expect(r._random()).toBe(0.573445922927931);
  expect(r._random()).toBe(0.4695413049776107);
  expect(r._random()).toBe(0.5943194630090147);
});

test('predefined dice values', () => {
  const r = Init(0);

  const rfns = [4, 6, 8, 10, 12, 20].map(v => {
    return { fn: r._api()[`D${v}`], highest: v };
  });

  rfns.forEach(pair => {
    const result = pair.fn();
    expect(result).toBeDefined();
    expect(result).toBeGreaterThanOrEqual(1);
    expect(result).toBeLessThanOrEqual(pair.highest);
    expect(r.state.prngstate).toBeDefined();

    const multiple = pair.fn(5);
    expect(multiple).toBeDefined();
    expect(multiple.length).toBe(5);
    multiple.forEach(m => {
      expect(m).toBeGreaterThanOrEqual(1);
      expect(m).toBeLessThanOrEqual(pair.highest);
    });
  });
});

test('Random.Die', () => {
  const r = Init(0);
  const _api = r._api();

  {
    const result = _api.Die(123);
    expect(result).toBeDefined();
    expect(result).toBe(74);
    expect(r.state.prngstate).toBeDefined();
  }

  {
    const result = _api.Die();
    expect(result).toBeDefined();
    expect(result).toBeLessThanOrEqual(6);
    expect(r.state.prngstate).toBeDefined();
  }

  {
    const multiple = _api.Die(6, 3);
    expect(multiple).toBeDefined();
    expect(multiple.length).toBe(3);
    multiple.forEach(m => {
      expect(m).toBeGreaterThanOrEqual(1);
      expect(m).toBeLessThanOrEqual(6);
    });
    expect(r.state.prngstate).toBeDefined();
  }
});

test('Random.Number', () => {
  const r = Init(0);
  const result = r._api().Number();
  expect(result).toBeDefined();
  expect(result).toBeGreaterThanOrEqual(0);
  expect(result).toBeLessThanOrEqual(1);
  expect(r.state.prngstate).toBeDefined();
});

test('Random.Shuffle', () => {
  const r = Init(0);
  const initialTiles = ['A', 'B', 'C', 'D', 'E'];
  const tiles = [...initialTiles];
  const result = r._api().Shuffle(tiles);
  expect(result.length).toEqual(initialTiles.length);
  expect(result).toEqual(expect.arrayContaining(initialTiles));
  expect(result.sort()).toEqual(initialTiles);
  expect(r.state.prngstate).toBeDefined();
});

test('Random API is not executed optimisitically', () => {
  const game = Game({
    seed: 0,
    moves: {
      rollDie: (G, ctx) => ({ ...G, die: ctx.random.D6() }),
    },
  });

  {
    const reducer = CreateGameReducer({ game });
    let state = reducer(undefined, { type: 'init' });
    expect(state.G.die).not.toBeDefined();
    state = reducer(state, makeMove('rollDie'));
    expect(state.G).toMatchObject({ die: 4 });
  }

  {
    const reducer = CreateGameReducer({ game, multiplayer: true });
    let state = reducer(undefined, { type: 'init' });
    expect(state.G.die).not.toBeDefined();
    state = reducer(state, makeMove('rollDie'));
    expect(state.G.die).not.toBeDefined();
  }
});
