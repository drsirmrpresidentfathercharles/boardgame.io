/*
 * Copyright 2018 The boardgame.io Authors
 *
 * Use of this source code is governed by a MIT-style
 * license that can be found in the LICENSE file or at
 * https://opensource.org/licenses/MIT.
 */

import { createGameReducer } from '../core/reducer';

// Initial implementation that just takes the first move
// and simulates till the end of the game.
export function Simulate({ game, bots, state }) {
  const reducer = createGameReducer({ game, numPlayers: state.ctx.numPlayers });

  let t = state;
  while (t.ctx.gameover === undefined && t.ctx.actionPlayers.length > 0) {
    const playerID = t.ctx.actionPlayers[0];
    const bot = bots[playerID];
    const { action } = bot.play(t);
    t = reducer(t, action);
  }

  return t;
}

export function Step({ game, bots, state }) {
  const reducer = createGameReducer({ game, numPlayers: state.ctx.numPlayers });

  let t = state;
  let tr = null;
  if (t.ctx.gameover === undefined && t.ctx.actionPlayers.length > 0) {
    const playerID = t.ctx.actionPlayers[0];
    const bot = bots[playerID];
    const { action, root } = bot.play(t);
    tr = root;
    t = reducer(t, action);
  }

  return { state: t, root: tr };
}

export class Bot {
  constructor({ next, playerID }) {
    this.next = next;
    this.playerID = playerID;
  }
}

export class RandomBot extends Bot {
  play({ G, ctx }) {
    const moves = this.next(G, ctx, this.playerID);
    return { action: moves[0] };
  }
}

export class MCTSBot extends Bot {
  constructor({ game, next, playerID }) {
    super({ next, playerID });
    this.id = 0;
    this.reducer = createGameReducer({ game });
  }

  createNode(state, move, parent) {
    const { G, ctx } = state;
    const actions = this.next(G, ctx, ctx.actionPlayers[0]);

    return {
      // Game state at this node.
      state,
      // Move used to get to this node.
      move,
      // Unexplored actions.
      actions,
      // Children of the node.
      children: [],
      // Parent of the node.
      parent,
      // Number of simulations that pass through this node.
      n: 0,
      // Number of wins for this node.
      w: 0,
    };
  }

  select(node) {
    // This node has unvisited children.
    if (node.actions.length > 0) {
      return node;
    }

    // This is a terminal node.
    if (node.children.length == 0) {
      return node;
    }

    let selectedChild = null;
    let best = 0.0;

    for (const child of node.children) {
      const uct =
        child.w / child.n + 1.41 * Math.sqrt(Math.log(node.n) / child.n);
      if (selectedChild == null || uct > best) {
        best = uct;
        selectedChild = child;
      }
    }

    return this.select(selectedChild);
  }

  expand(node) {
    const actions = node.actions;

    if (actions.length == 0) {
      return node;
    }

    const id = Math.floor(Math.random() * actions.length);
    const action = actions[id];
    node.actions.splice(id, 1);
    const childState = this.reducer(node.state, action);
    const childNode = this.createNode(childState, action, node);
    node.children.push(childNode);
    return childNode;
  }

  playout(node) {
    let state = node.state;

    while (state.ctx.gameover === undefined) {
      const { G, ctx } = state;
      const moves = this.next(G, ctx, ctx.actionPlayers[0]);
      const id = Math.floor(Math.random() * moves.length);
      const childState = this.reducer(state, moves[id]);
      state = childState;
    }

    return state.ctx.gameover;
  }

  backpropagate(node, result, rootPlayer) {
    node.n++;

    if (result.winner === rootPlayer) {
      node.w++;
    }

    if (result.draw === true) {
      node.w++;
    }

    if (node.parent) {
      this.backpropagate(node.parent, result, rootPlayer);
    }
  }

  play(state) {
    const root = this.createNode(state);
    const rootPlayer = root.state.ctx.currentPlayer;

    for (let i = 0; i < 500; i++) {
      const leaf = this.select(root);
      const child = this.expand(leaf);
      const result = this.playout(child);
      this.backpropagate(child, result, rootPlayer);
    }

    let selectedChild = null;
    let scores = {};
    for (const child of root.children) {
      const ratio = child.w / child.n;
      scores[child.move.payload.args] = ratio;
      if (selectedChild == null || ratio > selectedChild.w / selectedChild.n) {
        selectedChild = child;
      }
    }

    return { action: selectedChild.move, root };
  }
}
