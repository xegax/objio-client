import * as React from 'react';
import { LayoutDataList } from '../model/client/layout-datalist';
import { List } from 'ts-react-ui/list';
import { FitToParent } from 'ts-react-ui/fittoparent';
import { RenderArgs, ListColumn } from 'ts-react-ui/model/list';
import { Menu, ContextMenu, MenuItem } from '@blueprintjs/core';

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
        render: (args: RenderArgs<Array<string>>) => {
          return args.item[c];
        },
        renderHeader: (jsx: JSX.Element, col: ListColumn) => {
          return (
            <div onClick={() => model.toggleSort(col.name)} onContextMenu={e => this.onCtxMenu(e, col)}>
              {jsx}
            </div>
          );
        }
      };
    }));
  }

  onCtxMenu = (evt: React.MouseEvent, col: ListColumn) => {
    evt.preventDefault();
    evt.stopPropagation();

    ContextMenu.show((
      <Menu>
        <MenuItem text='hide column' onClick={() => this.props.model.hideColumn(col.name)}/>
        <MenuItem text='show all' onClick={() => this.props.model.showAllColumns()}/>
      </Menu>
    ), {left: evt.pageX, top: evt.pageY});
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
      <div style={{display: 'flex', flexGrow: 1, flexDirection: 'column'}}>
        {this.renderData()}
      </div>
    );
  }
}
