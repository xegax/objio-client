import * as React from 'react';
import { LayoutDataList } from '../model/client/layout-datalist';
import { List } from 'ts-react-ui/list';
import { FitToParent } from 'ts-react-ui/fittoparent';
import { RenderArgs } from 'ts-react-ui/model/list';

interface Props {
  model: LayoutDataList;
}

export class LayoutDataListView extends React.Component<Props, {}> {
  subscriber = () => {
    this.updateModel();
    this.setState({});
  }

  componentDidMount() {
    this.props.model.holder.subscribe(this.subscriber);
    this.updateModel();
  }

  componentWillUnmount() {
    this.props.model.holder.unsubscribe(this.subscriber);
  }

  updateModel() {
    const model = this.props.model;
    const render = model.getRender();
    render.setItemsCount(model.getTotalRows());
    render.setColumns(model.getColumnsToRender().map((col, c) => {
      return {
        name: col.name,
        render: (args: RenderArgs<Array<string>>) => args.item[c]
      };
    }));
  }

  renderColumnSelect(): JSX.Element {
    const model = this.props.model;
    if (model.getViewType() == 'table')
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
    const model = this.props.model;
    return (
      <div style={{display: 'flex', flexGrow: 1, flexDirection: 'column'}}>
        {this.renderColumnSelect()}
        <FitToParent wrapToFlex>
          <List border model={model.getRender()}/>
        </FitToParent>
      </div>
    );
  }
}
