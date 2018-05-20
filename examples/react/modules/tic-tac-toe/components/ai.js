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
    this.state = this.reducer(undefined, { type: 'init' });

    const next = (G, ctx, playerID) => {
      let r = [];
      for (let i = 0; i < 9; i++) {
        if (G.cells[i] === null) {
          r.push(makeMove('clickCell', i, playerID));
        }
      }
      return r;
    };

    this.bots = {
      '0': new MCTSBot({ game: TicTacToe, next, playerID: '0' }),
      '1': new MCTSBot({ game: TicTacToe, next, playerID: '1' }),
    };
  }

  simulate = () => {
    const endState = Simulate({
      game: TicTacToe,
      bots: this.bots,
      state: this.state,
    });
    this.setState({ ...endState });
  };

  step = () => {
    const { state, root } = Step({
      game: TicTacToe,
      bots: this.bots,
      state: this.state,
    });
    this.setState({ ...state, root });
  };

  render() {
    return (
      <div style={{ padding: 50 }}>
        <div>
          <button onClick={this.simulate}>Simulate</button>
          <button onClick={this.step}>Step</button>
        </div>

        <section style={{ float: 'left' }}>
          <h1>Board State</h1>
          <Board
            isPreview={true}
            G={this.state.G}
            ctx={this.state.ctx}
            moves={{}}
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
