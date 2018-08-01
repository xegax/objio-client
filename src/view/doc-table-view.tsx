import * as React from 'react';
import { DocTable } from '../model/client/doc-table';
import { WizardContent } from './wizard';
import { PushRowArgs, ColumnAttr, ExecuteArgs, Condition, CompoundCond, ValueCond } from 'objio-object/table';
import { DocContainer } from '../model/doc-container';
import { FileObject } from 'objio-object/file-object';
import { FitToParent } from 'ts-react-ui/fittoparent';
import { List, RenderListModel, RenderArgs } from 'ts-react-ui/list';
import { Menu, ContextMenu, MenuItem } from '@blueprintjs/core';
import { CSVFileObject } from 'objio-object/csv-file-object';

interface Props {
  model: DocTable;
}

interface State {
  editRow?: number;
  editCol?: number;
}

export class DocTableView extends React.Component<Props, State> {
  private input: {[key: string]: React.RefObject<HTMLInputElement>} = {};

  constructor(props: Props) {
    super(props);
    this.state = {};
  }

  getRender(): RenderListModel {
    return this.props.model.getRender();
  }

  selectRow = () => {
    console.log('sel-row', this.getRender().getSelRow());
  }

  componentDidMount() {
    this.props.model.holder.subscribe(this.subscriber);
    this.getRender().subscribe(this.selectRow, 'select-row');
    this.updateModel();
  }

  componentWillUnmount() {
    this.props.model.holder.unsubscribe(this.subscriber);
    this.getRender().unsubscribe(this.selectRow, 'select-row');
  }

  updateModel() {
    const model = this.getRender();
    const update = () => {
      this.updateModel();
      model.reload();
      model.notify();
    };

    model.setItemsCount(this.props.model.getTotalRowsNum());
    model.setColumns(this.props.model.getColumns().map((col, c) => {
      return {
        name: col.name,
        renderHeader: (jsx: JSX.Element) => {
          return (
            <div onContextMenu={evt => {
              const items = [
                <MenuItem
                  key='hc'
                  text={`hide column "${col.name}"`}
                  onClick={() => {
                    const cols = this.props.model.getColumns().map(col => col.name).filter(c => c != col.name);
                    this.props.model.updateSubtable({
                      cols,
                      sort: null
                    }).then(update);
                  }}
                />,
                <MenuItem
                  key='all'
                  text='show all column'
                  onClick={() => {
                    const cols = this.props.model.getAllColumns().map(col => col.name);
                    this.props.model.updateSubtable({
                      cols
                    }).then(update);
                  }}
                />,
                <MenuItem
                  key='sort-asc'
                  text='Sort asc'
                  onClick={() => {
                    this.props.model.updateSubtable({
                      sort: [{ column: col.name, dir: 'asc'} ]
                    }).then(update);
                  }}
                />,
                <MenuItem
                  key='sort-desc'
                  text='Sort desc'
                  onClick={() => {
                    this.props.model.updateSubtable({
                      sort: [{ column: col.name, dir: 'desc'} ]
                    }).then(update);
                  }}
                />,
                /*<MenuItem
                  key='filter'
                  text='Hide empty'
                  onClick={() => {
                    let filter: CompoundCond = this.props.model.getFilter() as CompoundCond || { op: 'or', values: [] };
                    filter.values = filter.values.filter((val: ValueCond) => val.column != col.name);
                    filter.values.push({ column: col.name, inverse: true, value: '' });

                    this.props.model.updateSubtable({ filter }).then(update);
                  }}
                />,*/
                <MenuItem
                  key='distinct'
                  text='Distinct'
                  onClick={() => {
                    this.props.model.updateSubtable({ distinct: { column: col.name } }).then(update);
                  }}
                />
              ];
              /*let filter = this.props.model.getFilter() as CompoundCond;
              let idx;
              if (filter && (idx = filter.values.findIndex((val: ValueCond) => val.column == col.name)) != -1) {
                items.push(
                  <MenuItem
                    key='unfilter'
                    text='Show all values'
                    onClick={() => {
                      filter = this.props.model.getFilter() as CompoundCond;
                      filter.values.splice(idx, 1);
                      this.props.model.updateSubtable({ filter }).then(update);
                    }}
                  />
                );
              }*/

              evt.preventDefault();
              evt.stopPropagation();
              ContextMenu.show(<Menu>{items}</Menu>, {left: evt.clientX, top: evt.clientY});
            }}>{jsx}</div>
          );
        },
        render: (args: RenderArgs<Array<string>>) => {
          if (this.state.editRow == args.rowIdx && this.state.editCol == args.colIdx)
            return (
              <input
                defaultValue={args.item[c]}
                ref={el => el && el.focus()}
                onBlur={() => {
                  this.setState({editCol: null, editRow: null});
                }}
              />
            );

          return (
            <div
              onDoubleClick={() => {
                this.setState({editRow: args.rowIdx, editCol: c});
              }}
            >
              {args.item[c]}
            </div>
          );
        }
      };
    }));
  }

  subscriber = () => {
    this.updateModel();
    this.setState({});
  };

  /*append() {
    const table = this.props.model;

    const args: PushRowArgs = {values: {}};
    table.getColumns().forEach(col => {
      args.values[col.name] = [this.input[col.name].current.value];
    });
    table.pushCells(args);
  }*/

  renderTable(): JSX.Element {
    return (
      <FitToParent wrapToFlex>
        <List border model = { this.getRender() } />
      </FitToParent>
    );
  }

  renderInvalid(): JSX.Element {
    const state = this.props.model.getState();
    const stateType = state.getType();
    if (stateType == 'in progress')
      return (
        <div>in progress, {state.getProgress()}</div>
      );

    return (
      <div>not confgured</div>
    );
  }

  renderValid() {
    const model = this.props.model;
    return (
      <React.Fragment>
        <div>table: {model.getTable()}</div>
        <div>rows: {model.getTotalRowsNum()}</div>
        <div>last execute time: {model.getLastExecuteTime()}</div>
        <div>
          <button
            onClick={() => {
              const args: ExecuteArgs = {
                table: model.getTable(),
                fileObjId: model.getFileObjId()
              };

              model.holder.getObject<FileObject>(model.getFileObjId())
              .then(file => {
                const csv = file.getImpl<CSVFileObject>();
                args.columns = csv.getColumns();
                model.execute(args);
              });
            }}
          >
            execute
          </button>
        </div>
        {this.renderTable()}
      </React.Fragment>
    );
  }

  render() {
    const model = this.props.model;
    return (
      <div style={{display: 'flex', flexDirection: 'column', flexGrow: 1}}>
        {model.getState().isValid() ? this.renderValid() : this.renderInvalid()}
      </div>
    );
  }
}

export class DocTableWizard extends WizardContent<{model: DocContainer}> {
  private src: React.RefObject<HTMLSelectElement> = React.createRef<HTMLSelectElement>();
  private name: React.RefObject<HTMLInputElement> = React.createRef<HTMLInputElement>();

  getSrcObj(): FileObject {
    const id = this.src.current.value;
    if (id == '-1')
      return null;

    const doc = this.props.model.getChildren().getArray().find(item => {
      return item.holder.getID() == id;
    });

    return doc.getDoc() as FileObject;
  }

  getResult() {
    const srcObj = this.getSrcObj();

    if (!srcObj) {
      return {
        table: this.name.current.value,
        columns: [
          { name: 'col1', type: 'INTEGER' },
          { name: 'col2', type: 'TEXT' },
          { name: 'col3', type: 'TEXT' }
        ]
      };
    } else {
      return {
        table: this.name.current.value,
        fileObjId: srcObj.holder.getID()
      };
    }
  }

  renderSrcSelect(): JSX.Element {
    const docs = this.props.model.getChildren().getArray().filter(item => {
      const doc = item.getDoc();
      return doc instanceof FileObject && doc.getName().toLocaleLowerCase().endsWith('.csv');
    });

    return (
      <div>
        <select ref={this.src} onChange={() => {
          const srcObj = this.getSrcObj();
          if (srcObj) {
            this.name.current.value = srcObj.getName();
          } else {
            this.name.current.value = 'table_' + Date.now().toString(16);
          }
        }}>
          <option value='-1'>create new</option>
          {docs.map((item, i) => {
            const file = item.getDoc() as FileObject;
            return <option value={item.holder.getID()}>{file.getName()}</option>;
          })}
        </select>
      </div>
    );
  }

  renderTableName() {
    return (
      <div>
        <input ref={this.name} defaultValue={`table_${Date.now().toString(16)}`}/>
      </div>
    );
  }

  render() {
    return (
      <div>
        {this.renderSrcSelect()}
        {this.renderTableName()}
      </div>
    );
  }
}
