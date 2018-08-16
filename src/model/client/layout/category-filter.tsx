import * as React from 'react';
import { CategoryFilter as Base } from '../../server/layout/category-filter';
import { DocTable } from '../doc-table';
import { ColumnAttr, LoadCellsArgs, Condition } from 'objio-object/table';
import { RenderListModel } from 'ts-react-ui/list';
import { RenderArgs } from 'ts-react-ui/model/list';
import { cancelable, Cancelable, timer } from 'objio/common/promise';
import { DocLayout } from '../doc-layout';
import { DataSourceHolderArgs } from '../../server/doc-layout';
import { cn } from '../../../common/common';
import { CondHolder, CondHolderOwner } from './cond-holder';

const classes = {
  excluded: 'excluded'
};

const TIME_BETWEEN_REQUEST = 300;



export class CategoryFilter extends Base<DocTable, DocLayout> implements CondHolderOwner {
  private render = new RenderListModel(0, 20);
  private lastLoadTimer: Cancelable;
  private subtable: string;
  private colsToRender = Array<ColumnAttr>();
  private rowsNum: number = 0;
  private rowsCache: {[rowIdx: string]: string} = {};
  private sel = Array<string>();
  private excludeSel = new Set<string>();
  private condHolder = new CondHolder();

  constructor(args: DataSourceHolderArgs<DocTable, DocLayout>) {
    super(args);

    this.render.setHandler({
      loadItems: (first, count) => {
        if (this.lastLoadTimer) {
          this.lastLoadTimer.cancel();
          this.lastLoadTimer = null;
        }

        this.lastLoadTimer = cancelable(timer(TIME_BETWEEN_REQUEST));
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
  }

  getCondHolder(): CondHolder {
    return this.condHolder;
  }

  updateCondition() {
    this.sel = this.render.getSel().map(rowIdx => {
      return this.rowsCache[rowIdx] || (
        this.rowsCache[rowIdx] = this.render.getItems(+rowIdx, 1)[0][0] as string
      );
    });

    if (this.sel.length + this.excludeSel.size == 0) {
      this.setCondition(null);
    } else if (this.sel.length == 1 && this.excludeSel.size == 0) {
      this.setCondition({ column: this.column, value: this.sel[0] });
    } else if (this.sel.length == 0 && this.excludeSel.size == 1) {
      this.setCondition({ column: this.column, inverse: true, value: Array.from(this.excludeSel)[0]});
    } else {
      const cond: Condition = { op: 'or', values: this.sel.map(value => ({ column: this.column, value }))};
      const exclude: Condition = {
        op: 'and',
        values: Array.from(this.excludeSel).map(value => {
          return { column: this.column, inverse: true, value };
        })
      };

      if (this.excludeSel.size == 0) {
        this.setCondition(cond);
      } else if (this.sel.length == 0) {
        this.setCondition(exclude);
      } else {
        this.setCondition({ op: 'and', values: [ cond, exclude ] } as Condition);
      }
    }
  }

  setCondition(cond: Condition): void {
    this.condHolder.setCondition(cond, this.layout.getObjects().getArray(), this);
  }

  onInit = () => {
    this.render.setHeader(false);
    this.source.getState().holder.addEventHandler({
      onObjChange: () => this.holder.notify()
    });

    this.updateSubtable();

    this.render.subscribe(() => {
      this.updateCondition();
    }, 'select-row');

    return Promise.resolve();
  }

  updateSubtable = () => {
    return this.source.getTableRef().createSubtable({
      distinct: { column: this.getColumn() },
      sort: [{ column: 'count', dir: 'desc' }]
    }).then(res => {
      this.colsToRender = res.columns;
      this.subtable = res.subtable;
      this.rowsNum = res.rowsNum;
      this.updateRenderModel();
    }).then(() => {
      this.rowsCache = {};
      this.sel = [];
      this.render.reload();
      this.holder.notify();
    });
  }

  updateRenderModel() {
    this.render.setItemsCount(this.rowsNum);
    this.render.setColumns([{
        name: this.colsToRender[0].name,
        render: (args: RenderArgs<Array<string>>) => {
          return (
            <div style={{display: 'flex'}} className={cn(this.excludeSel.has(args.item[0]) && classes.excluded)}>
              <i
                className='fa fa-eye-slash'
                onClick={evt => {
                  this.excludeValue(args.item[0]);
                  evt.preventDefault();
                  evt.stopPropagation();
                }}
              />
              <div style={{flexGrow: 1}}>{args.item[0]}</div>
              <div style={{flexGrow: 0}}>{args.item[1]}</div>
            </div>
          );
        }
      }
    ]);
  }

  excludeValue(value: string) {
    if (!this.excludeSel.has(value)) {
      this.excludeSel.add(value);
    } else {
      this.excludeSel.delete(value);
    }

    this.updateCondition();
    this.holder.delayedNotify();
  }

  getRender(): RenderListModel {
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
