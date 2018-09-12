import * as React from 'react';
import { List } from 'ts-react-ui/list';
import { FitToParent } from 'ts-react-ui/fittoparent';
import { DrillDownTable } from '../../model/client/layout/drilldown-table';

import './_drilldown-table.scss';

export { DrillDownTable };

const classes = {
  class: 'drilldown-table'
};

interface Props {
  model: DrillDownTable;
}

export class DrillDownTableView extends React.Component<Props> {
  private ref = React.createRef<HTMLInputElement>();

  subscriber = () => {
    this.setState({});
  }

  componentDidMount() {
    this.props.model.holder.subscribe(this.subscriber);
  }

  componentWillUnmount() {
    this.props.model.holder.unsubscribe(this.subscriber);
  }

  renderIdColumnSelect(): JSX.Element {
    const model = this.props.model;
    if (!model.isEdit())
      return null;

    const value = model.getIdColumn();
    return (
      <div style={{display: 'flex'}}>id column: 
        <select
          style={{flexGrow: 1}}
          value={value}
          onChange={e => {
            model.setIdColumn(e.currentTarget.value);
          }}
        >
          {model.getColumns().map((col, i) => {
            return <option key={i} value={col.name}>{col.name}</option>;
          })}
        </select>
      </div>
    );
  }

  renderData(): JSX.Element {
    const model = this.props.model;
    const state = model.get();
    if (!state.isStatusValid()) {
      return <React.Fragment>in progress: {state.getProgress()}</React.Fragment>;
    }

    return (
      <React.Fragment>
        {this.renderIdColumnSelect()}
        <FitToParent wrapToFlex>
          <List border model={model.getRender()}/>
        </FitToParent>
        <div>rows: {model.getTotalRows()}</div>
      </React.Fragment>
    );
  }

  render() {
    return (
      <div className={classes.class}>
        {this.renderData()}
        <input ref={this.ref} onKeyDown={evt => {
          if (evt.keyCode == 13)
            this.props.model.applySQLCond(this.ref.current.value);
        }}/>
      </div>
    );
  }
}
