import React from 'react';
import PropTypes from 'prop-types';
import './mcts-debug.css';

export class MCTSDebug extends React.Component {
  constructor(props) {
    super(props);
    this.state = { root: props.root };
  }

  static propTypes = {
    root: PropTypes.any.isRequired,
    renderState: PropTypes.func,
  };

  componentWillReceiveProps(nextProps) {
    this.setState({ root: nextProps.root });
  }

  render() {
    const root = this.state.root;

    const children = root.children.map((child, i) => {
      return (
        <MCTSNode
          key={i}
          onClick={() => this.setState({ root: child })}
          renderState={this.props.renderState}
          {...child}
          pn={root.n}
        />
      );
    });

    const parent = root.parent && (
      <MCTSNode
        onClick={() => this.setState({ root: root.parent })}
        renderState={this.props.renderState}
        {...root.parent}
      />
    );

    return (
      <div className="mcts-tree">
        {parent}
        <MCTSNode
          {...root}
          isRoot={true}
          renderState={this.props.renderState}
        />
        <div className="children">{children}</div>
      </div>
    );
  }
}

const MCTSNode = ({ state, w, n, pn, renderState, onClick, isRoot }) => {
  let classes = 'mcts-node';
  if (isRoot) {
    classes += ' mcts-root';
  }

  let uct = w / n + 1.41 * Math.sqrt(Math.log(pn) / n);
  let ratio = w / n;
  uct = Math.floor(100 * uct);
  ratio = Math.floor(100 * ratio);

  if (!pn) uct = null;

  return (
    <div className={classes} onClick={onClick}>
      <li>ratio {ratio}</li>
      {uct && <li>UCT {uct}</li>}
      <li>w {w}</li>
      <li>n {n}</li>

      {renderState && renderState(state)}
    </div>
  );
};

MCTSNode.propTypes = {
  state: PropTypes.any,
  renderState: PropTypes.func,
  w: PropTypes.any,
  n: PropTypes.any,
  pn: PropTypes.any,
  isRoot: PropTypes.any,
  onClick: PropTypes.any,
};
