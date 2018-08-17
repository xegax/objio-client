import * as React from 'react';
import { DrillDownTable as Base } from '../../server/layout/drilldown-table';
import { DocTable } from '../doc-table';
import { ColumnAttr, LoadCellsArgs, SubtableAttrs, SortPair } from 'objio-object/table';
import { RenderListModel } from 'ts-react-ui/list';
import { RenderArgs, ListColumn } from 'ts-react-ui/model/list';
import { cancelable, Cancelable, timer } from 'objio/common/promise';
import { DocLayout } from '../doc-layout';
import { DataSourceHolderArgs } from '../../server/doc-layout';
import { ContextMenu, Menu, MenuItem } from '@blueprintjs/core';
import { CondHolder, EventType, CondHolderOwner } from './cond-holder';
import { SelectProv, SelectProvOwner, EventTypes } from './common';

export class DrillDownTable extends Base<DocTable, DocLayout> implements CondHolderOwner, SelectProvOwner {
  private render = new RenderListModel(0, 20);
  private lastLoadTimer: Cancelable;
  private maxTimeBetweenRequests: number = 300;
  private subtable: string;
  private colsToRender = Array<ColumnAttr>();
  private colsFromSrv = Array<ColumnAttr>();
  private rowsNum: number = 0;
  private sort: SortPair;
  private cond = new CondHolder();

  constructor(args: DataSourceHolderArgs<DocTable, DocLayout>) {
    super(args);

    this.render.setHandler({
      loadItems: (first, count) => {
        if (this.lastLoadTimer) {
          this.lastLoadTimer.cancel();
          this.lastLoadTimer = null;
        }

        this.lastLoadTimer = cancelable(timer(this.maxTimeBetweenRequests));
        return this.lastLoadTimer.then(() => {
          this.lastLoadTimer = null;

          const args: LoadCellsArgs = { first, count };
          if (this.subtable)
            args.table = this.subtable;

          return this.source.getTableRef().loadCells(args);
        });
      }
    });

    this.holder.addEventHandler({
      onLoad: this.onInit,
      onCreate: this.onInit,
      onObjChange: this.updateTable
    });

    this.holder.subscribe(this.requestTable, EventType.change);
    this.render.subscribe(() => {
      this.layout.delayedNotifyObjects(EventTypes.selProvSelection);
    }, 'select-row');
  }

  getSelProv(): SelectProv {
    return {
      getSelection: (): Array<string> => {
        const sel = this.render.getSel();
        if (!sel.length)
          return [];

        const row = this.render.getItems(+sel[sel.length - 1], 1)[0];
        return [ row[this.colsFromSrv.findIndex(col => col.name == this.idColumn)] ];
      }
    };
  }

  onInit = () => {
    this.source.getState().holder.addEventHandler({
      onObjChange: () => this.holder.notify()
    });

    this.updateTable();
    return Promise.resolve();
  }

  getCondHolder() {
    return this.cond;
  }

  requestTable = () => {
    const args: Partial<SubtableAttrs> = {};
    const filter = this.cond.getMergedCondition(this, this.layout.getObjects().getArray());
    if (filter)
      args.filter = filter;

    if (this.sort)
      args.sort = [this.sort];

    if (this.colsToShow.length)
      args.cols = this.colsToShow.slice();

    // keep idColumn
    if (this.idColumn && args.cols && args.cols.indexOf(this.idColumn) == -1)
      args.cols.splice(0, 0, this.idColumn);

    this.source.getTableRef().createSubtable(args)
    .then(res => {
      this.colsFromSrv = res.columns.slice();
      this.colsToRender = res.columns.slice();
      // if idColumn has to be hidden
      if (this.colsToShow.length && this.idColumn && this.colsToShow.indexOf(this.idColumn) == -1) {
        this.colsToRender = this.colsToRender.filter(col => col.name != this.idColumn);
      }

      this.subtable = res.subtable;
      this.rowsNum = res.rowsNum;
      this.updateRenderModel();
      this.render.reload();
      this.holder.notify();
    });
  };

  updateTable = () => {
    this.colsToRender = this.source.getAllColumns();
    if (this.colsToShow.length) {
      this.colsToRender = this.colsToRender.filter(col => {
        return this.colsToShow.indexOf(col.name) != -1;
      });
    }

    this.rowsNum = this.source.getTotalRowsNum();
    this.requestTable();
  }

  getRender() {
    return this.render;
  }

  getColumns(): Array<ColumnAttr> {
    return this.source.getAllColumns();
  }

  getColumnsToRender() {
    return this.colsToRender;
  }

  getTotalRows() {
    return this.rowsNum;
  }

  updateRenderModel() {
    this.render.setItemsCount(this.rowsNum);
    this.render.setColumns(this.colsToRender.map((col, c) => {
      c = this.colsFromSrv.findIndex(srvCol => srvCol.name == col.name);
      return {
        name: col.name,
        render: (args: RenderArgs<Array<string>>) => {
          return <div>{args.item[c]}</div>;
        },
        renderHeader: (jsx: JSX.Element, col: ListColumn) => {
          return (
            <div
              onContextMenu={evt => this.onCtxMenu(evt, col)}
              onClick={() => this.toggleSort(col.name)}
            >
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
        <MenuItem text='hide column' onClick={() => this.hideColumn(col.name)}/>
        <MenuItem text='show all' onClick={() => this.showAllColumns()}/>
      </Menu>
    ), {left: evt.pageX, top: evt.pageY});
  }

  hideColumn(col: string) {
    if (this.colsToShow.length == 0)
      this.colsToShow = this.source.getAllColumns().map(col => col.name);

    this.colsToShow.splice(this.colsToShow.indexOf(col), 1);
    this.holder.save();
    this.requestTable();
  }

  showAllColumns() {
    this.colsToShow = [];
    this.holder.save();
    this.requestTable();
  }

  applySQLCond(sql: string): void {
    const args: Partial<SubtableAttrs> = { filter: sql };

    if (this.sort)
      args.sort = [this.sort];

    if (this.colsToShow.length)
      args.cols = this.colsToShow;

    this.source.getTableRef().createSubtable(args)
    .then(res => {
      this.colsToRender = res.columns;
      this.subtable = res.subtable;
      this.rowsNum = res.rowsNum;
      this.updateRenderModel();
      this.render.reload();
      this.holder.notify();
    });
  }

  setSort(column: string, dir: 'asc' | 'desc') {
    this.sort = { column, dir };
    this.requestTable();
  }

  toggleSort(column: string) {
    if (this.sort && this.sort.column == column) {
      this.sort.dir = this.sort.dir == 'asc' ? 'desc' : 'asc';
    } else {
      this.sort = { column, dir: 'asc' };
    }
    this.requestTable();
  }
}
