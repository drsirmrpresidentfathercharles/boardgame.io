/*
 * Copyright 2017 The boardgame.io Authors.
 *
 * Use of this source code is governed by a MIT-style
 * license that can be found in the LICENSE file or at
 * https://opensource.org/licenses/MIT.
 */

import React from 'react';
import { createGameReducer } from '../../../../../src/core/reducer';
import { makeMove } from '../../../../../src/core/action-creators';
import TicTacToe from '../game';
import Board from './board';
import { Step, Simulate, MCTSBot } from '../../../../../src/ai/ai';
import { MCTSDebug } from '../../../../../src/ai/mcts-debug';

class AI extends React.Component {
  constructor(props) {
    super(props);

    this.reducer = createGameReducer({ game: TicTacToe });
    this.state = {
      iterations: 500,
      seed: 'tictac',
      gameState: this.reducer(undefined, { type: 'init' }),
    };

    this.next = (G, ctx, playerID) => {
      let r = [];
      for (let i = 0; i < 9; i++) {
        if (G.cells[i] === null) {
          r.push(makeMove('clickCell', i, playerID));
        }
      }
      return r;
    };

    this.createBots();
  }

  createBots = () => {
    this.bots = {
      '0': new MCTSBot({
        iterations: this.state.iterations,
        seed: this.state.seed,
        game: TicTacToe,
        next: this.next,
        playerID: '0',
      }),
      '1': new MCTSBot({
        iterations: this.state.iterations,
        seed: this.state.seed,
        game: TicTacToe,
        next: this.next,
        playerID: '1',
      }),
    };
  };

  reset = () => {
    this.createBots();
    this.setState({
      gameState: this.reducer(undefined, { type: 'init' }),
      root: null,
    });
  };

  simulate = () => {
    const { state: gameState } = Simulate({
      game: TicTacToe,
      bots: this.bots,
      state: this.state.gameState,
    });
    this.setState({ gameState, root: null });
  };

  step = () => {
    const { state: gameState, metadata: root } = Step({
      game: TicTacToe,
      bots: this.bots,
      state: this.state.gameState,
    });
    this.setState({ gameState, root });
  };

  onIterationChange = e => {
    const iterations = parseInt(e.target.value);
    this.bots['0'].iterations = iterations;
    this.bots['1'].iterations = iterations;
    this.setState({ iterations });
  };

  onSeedChange = e => {
    const seed = e.target.value;
    this.setState({ seed }, this.createBots);
  };

  clickCell = id => {
    const nextState = this.reducer(
      this.state.gameState,
      makeMove('clickCell', [id])
    );
    this.setState({ gameState: nextState, root: null });
  };

  render() {
    return (
      <div style={{ padding: 50 }}>
        <div style={{ marginBottom: '20px' }}>
          <div>
            <label>MCTS Iterations</label>
            <input
              onChange={this.onIterationChange}
              type="text"
              style={{ width: 50, marginLeft: 20 }}
              value={this.state.iterations}
            />
          </div>

          <div>
            <label>Seed</label>
            <input
              onChange={this.onSeedChange}
              type="text"
              style={{ width: 50, marginLeft: 86 }}
              value={this.state.seed}
            />
          </div>

          <button onClick={this.simulate}>Simulate</button>
          <button onClick={this.step}>Step</button>
          <button onClick={this.reset}>Reset</button>
        </div>

        <section style={{ float: 'left' }}>
          <Board
            isPreview={true}
            G={this.state.gameState.G}
            ctx={this.state.gameState.ctx}
            isActive={true}
            moves={{ clickCell: this.clickCell }}
          />
        </section>

        {this.state.root && (
          <section style={{ width: '1000px', float: 'right' }}>
            <h1 style={{ textAlign: 'center' }}>MCTS tree</h1>
            <MCTSDebug
              root={this.state.root}
              renderState={state => (
                <div style={{ transform: 'scale(0.7)' }}>
                  <Board {...state} isPreview={true} moves={{}} />
                </div>
              )}
            />
          </section>
        )}
      </div>
    );
  }
}

export default AI;
