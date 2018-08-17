import * as React from 'react';
import { List } from 'ts-react-ui/list';
import { FitToParent } from 'ts-react-ui/fittoparent';
import './_category-filter.scss';
import { TagFilter } from '../../model/client/layout/tag-filter';

export { TagFilter };

const classes = {
  filter: 'category-filter'
};

interface Props {
  model: TagFilter;
}

export class TagFilterView extends React.Component<Props> {
  subscriber = () => {
    this.setState({});
  }

  componentDidMount() {
    this.props.model.holder.subscribe(this.subscriber);
  }

  componentWillUnmount() {
    this.props.model.holder.unsubscribe(this.subscriber);
  }

  renderColumnSelect(): JSX.Element {
    const model = this.props.model;

    if (!model.isEdit())
      return null;

    const value = model.getColumn();
    return (
      <div style={{display: 'flex'}}>column: 
        <select
          style={{flexGrow: 1}}
          value={value}
          onChange={e => {
            model.setColumn(e.currentTarget.value);
          }}
        >
          {model.getColumns().map((col, i) => {
            return <option key={i} value={col.name}>{col.name}</option>;
          })}
        </select>
      </div>
    );
  }

  renderJoinColumnSelect(): JSX.Element {
    const model = this.props.model;
    if (!model.isEdit())
      return null;

    const value = model.getJoinColumn();
    return (
      <div style={{display: 'flex'}}>join: 
        <select
          style={{flexGrow: 1}}
          value={value}
          onChange={e => {
            model.setJoinColumn(e.currentTarget.value);
          }}
        >
          {model.getColumns().map((col, i) => {
            return <option key={i} value={col.name}>{col.name}</option>;
          })}
        </select>
      </div>
    );
  }

  renderTargetSelect(): JSX.Element {
    const model = this.props.model;

    if (!model.isEdit())
      return null;

    const all = model.getAllSources();
    const target = model.getTarget() || model.get();
    if (all.length == 1 && all.indexOf(target) == 0)
      return null;

    return (
      <div style={{display: 'flex'}}>target: 
        <select
          style={{flexGrow: 1}}
          value={target.holder.getID()}
          onChange={e => {
            model.setTarget(all.find(src => src.holder.getID() == e.currentTarget.value));
          }}
        >
          {all.map((src, i) => {
            return <option key={i} value={src.holder.getID()}>{src.getTable()}</option>;
          })}
        </select>
      </div>
    );
  }

  renderData(): JSX.Element {
    const model = this.props.model;
    const state = model.get().getState();
    if (!state.isValid()) {
      return <React.Fragment>in progress: {state.getProgress()}</React.Fragment>;
    }

    return (
      <React.Fragment>
        {this.renderColumnSelect()}
        {this.renderTargetSelect()}
        {this.renderJoinColumnSelect()}
        <FitToParent wrapToFlex>
          <List border model={model.getRender()}/>
        </FitToParent>
        <div>rows: {model.getTotalRows()}</div>
      </React.Fragment>
    );
  }

  render() {
    return (
      <div className={classes.filter}>
        {this.renderData()}
      </div>
    );
  }
}
