/*
 * Copyright 2018 The boardgame.io Authors
 *
 * Use of this source code is governed by a MIT-style
 * license that can be found in the LICENSE file or at
 * https://opensource.org/licenses/MIT.
 */

import Game from '../core/game';
import { createGameReducer } from '../core/reducer';
import { makeMove } from '../core/action-creators';
import { Simulate, Step, Bot, RandomBot, MCTSBot } from './ai';

function IsVictory(cells) {
  const positions = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];

  for (let pos of positions) {
    const symbol = cells[pos[0]];
    let winner = symbol;
    for (let i of pos) {
      if (cells[i] != symbol) {
        winner = null;
        break;
      }
    }
    if (winner != null) return true;
  }

  return false;
}

const TicTacToe = Game({
  setup: () => ({
    cells: Array(9).fill(null),
  }),

  moves: {
    clickCell(G, ctx, id) {
      const cells = [...G.cells];
      if (cells[id] === null) {
        cells[id] = ctx.currentPlayer;
      }
      return { ...G, cells };
    },
  },

  flow: {
    movesPerTurn: 1,

    endGameIf: (G, ctx) => {
      if (IsVictory(G.cells)) {
        return { winner: ctx.currentPlayer };
      }

      if (G.cells.filter(t => t == null).length == 0) {
        return { draw: true };
      }
    },
  },
});

const next = (G, ctx, playerID) => {
  let r = [];
  for (let i = 0; i < 9; i++) {
    if (G.cells[i] === null) {
      r.push(makeMove('clickCell', i, playerID));
    }
  }
  return r;
};

test('Simulate', () => {
  const bots = {
    '0': new RandomBot({ seed: 'test', next, playerID: '0' }),
    '1': new RandomBot({ seed: 'test', next, playerID: '1' }),
  };
  const reducer = createGameReducer({ game: TicTacToe });
  const state = reducer(undefined, { type: 'init' });
  const { state: endState } = Simulate({ game: TicTacToe, bots, state });
  expect(endState.ctx.gameover).not.toBe(undefined);
});

test('Step', () => {
  const bots = {
    '0': new RandomBot({ seed: 'test', next, playerID: '0' }),
    '1': new RandomBot({ seed: 'test', next, playerID: '1' }),
  };
  const reducer = createGameReducer({ game: TicTacToe });
  let state = reducer(undefined, { type: 'init' });
  const { state: endState } = Step({ game: TicTacToe, bots, state });
  expect(endState.G.cells.filter(t => t !== null).length).toBe(1);
  expect(endState.ctx.gameover).toBe(undefined);

  state.G.cells = new Array(9).fill('0');
  state.G.cells[0] = null;
  state = Step({ game: TicTacToe, bots, state }).state;
  expect(state.ctx.gameover).not.toBe(undefined);
  state = Step({ game: TicTacToe, bots, state }).state;
  expect(state.ctx.gameover).not.toBe(undefined);
});

test('Bot', () => {
  const b = new Bot({});
  expect(b.random()).toBeGreaterThanOrEqual(0);
  expect(b.random()).toBeLessThan(1);
});

describe('MCTSBot', () => {
  test('defaults', () => {
    const b = new MCTSBot({ game: TicTacToe });
    expect(b.iterations).toBe(500);
  });

  test('RandomBot vs. MCTSBot', () => {
    const bots = {
      '0': new RandomBot({ seed: 'test', next, playerID: '0' }),
      '1': new MCTSBot({
        iterations: 200,
        seed: 'test',
        game: TicTacToe,
        next,
        playerID: '1',
      }),
    };

    const reducer = createGameReducer({ game: TicTacToe });

    for (let i = 0; i < 5; i++) {
      const state = reducer(undefined, { type: 'init' });
      const { state: endState } = Simulate({ game: TicTacToe, bots, state });
      expect(endState.ctx.gameover).not.toEqual({ winner: '0' });
    }
  });

  test('MCTSBot vs. MCTSBot', () => {
    const reducer = createGameReducer({ game: TicTacToe });
    const iterations = 400;

    for (let i = 0; i < 5; i++) {
      const bots = {
        '0': new MCTSBot({
          seed: i,
          game: TicTacToe,
          next,
          playerID: '0',
          iterations,
        }),
        '1': new MCTSBot({
          seed: i,
          game: TicTacToe,
          next,
          playerID: '1',
          iterations,
        }),
      };
      const state = reducer(undefined, { type: 'init' });
      const { state: endState } = Simulate({ game: TicTacToe, bots, state });
      expect(endState.ctx.gameover).toEqual({ draw: true });
    }
  });
});
