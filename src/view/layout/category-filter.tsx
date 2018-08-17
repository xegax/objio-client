import * as React from 'react';
import { List } from 'ts-react-ui/list';
import { FitToParent } from 'ts-react-ui/fittoparent';
import './_category-filter.scss';
import { CategoryFilter } from '../../model/client/layout/category-filter';

export { CategoryFilter };

const classes = {
  filter: 'category-filter'
};

interface Props {
  model: CategoryFilter;
}

export class CategoryFilterView extends React.Component<Props> {
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
      <select
        value={value}
        onChange={e => {
          model.setColumn(e.currentTarget.value);
        }}
      >
        {model.getColumns().map((col, i) => {
          return <option key={i} value={col.name}>{col.name}</option>;
        })}
      </select>
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
