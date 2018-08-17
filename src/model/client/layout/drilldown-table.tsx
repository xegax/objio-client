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

export class DrillDownTable extends Base<DocTable, DocLayout> implements CondHolderOwner {
  private render = new RenderListModel(0, 20);
  private lastLoadTimer: Cancelable;
  private maxTimeBetweenRequests: number = 300;
  private subtable: string;
  private colsToRender = Array<ColumnAttr>();
  private rowsNum: number = 0;
  private subtableArgs: string;
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
      onObjChange: this.updateSubtable
    });

    this.holder.subscribe(this.subscriber, EventType.change);
  }

  onInit = () => {
    this.source.getState().holder.addEventHandler({
      onObjChange: () => this.holder.notify()
    });

    this.updateSubtable();
    return Promise.resolve();
  }

  getCondHolder() {
    return this.cond;
  }

  subscriber = () => {
    const args: Partial<SubtableAttrs> = {};
    const filter = this.cond.getMergedCondition(this, this.layout.getObjects().getArray());
    if (filter)
      args.filter = filter;

    if (this.sort)
      args.sort = [this.sort];

    if (this.colsToShow.length)
      args.cols = this.colsToShow;

    const newArgs = JSON.stringify(args);
    if (this.subtableArgs == newArgs)
      return;
    this.subtableArgs = newArgs;

    this.source.getTableRef().createSubtable(args)
    .then(res => {
      this.colsToRender = res.columns;
      this.subtable = res.subtable;
      this.rowsNum = res.rowsNum;
      this.updateRenderModel();
      this.render.reload();
      this.holder.notify();
    });
  };

  updateSubtable = () => {
    this.colsToRender = this.source.getAllColumns();
    if (this.colsToShow.length) {
      this.colsToRender = this.colsToRender.filter(col => {
        return this.colsToShow.indexOf(col.name) != -1;
      });
    }

    this.rowsNum = this.source.getTotalRowsNum();
    this.updateRenderModel();
    this.render.reload();
    this.holder.notify();
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
    this.subscriber();
  }

  showAllColumns() {
    this.colsToShow = [];
    this.holder.save();
    this.subscriber();
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
    this.subscriber();
  }

  toggleSort(column: string) {
    if (this.sort && this.sort.column == column) {
      this.sort.dir = this.sort.dir == 'asc' ? 'desc' : 'asc';
    } else {
      this.sort = { column, dir: 'asc' };
    }
    this.subscriber();
  }

  getColumn(): string {
    return this.column || this.getColumns()[0].name;
  }

  setColumn(name: string): void {
    this.column = name;
    this.holder.save();
    this.holder.notify();

    this.updateSubtable();
  }
}
