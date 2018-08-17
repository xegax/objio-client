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

  renderData(): JSX.Element {
    const model = this.props.model;
    const state = model.get().getState();
    if (!state.isValid()) {
      return <React.Fragment>in progress: {state.getProgress()}</React.Fragment>;
    }

    return (
      <React.Fragment>
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
