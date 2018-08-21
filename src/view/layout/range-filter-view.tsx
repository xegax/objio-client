import * as React from 'react';
import { RangeFilter } from '../../model/client/layout/range-filter';
import { RangeSlider } from 'ts-react-ui/range-slider';
import './range-filter-view.scss';

export {
  RangeFilter
};

const classes = {
  rangeFilter: 'range-filter-view',
  label: 'range-filter-view-label',
  ctrl: 'range-filter-view-ctrl'
};

interface Props {
  model: RangeFilter;
}

export class RangeFilterView extends React.Component<Props> {
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

  render() {
    const model = this.props.model.getSlider();
    const range = model.getRange();
    return (
      <React.Fragment>
        {this.renderColumnSelect()}
        <div className={classes.rangeFilter}>
          <div className={classes.label}>{range.from}</div>
          <div className={classes.ctrl}>
            <RangeSlider model={model}/>
          </div>
          <div className={classes.label}>{range.to}</div>
        </div>
      </React.Fragment>
    );
  }
}