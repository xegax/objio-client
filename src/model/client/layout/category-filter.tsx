import * as React from 'react';
import { CategoryFilter as Base } from '../../server/layout/category-filter';
import { DocTable } from 'objio-object/client/doc-table';
import { ColumnAttr, LoadCellsArgs, Condition } from 'objio-object/client/table';
import { RenderListModel } from 'ts-react-ui/list';
import { RenderArgs } from 'ts-react-ui/model/list';
import { Cancelable, ExtPromise } from 'objio';
import { DocLayout } from '../doc-layout';
import { cn } from '../../../common/common';
import { CondHolder, CondHolderOwner } from './cond-holder';
import { OBJIOItem } from 'objio';

const classes = {
  excluded: 'excluded'
};

const TIME_BETWEEN_REQUEST = 300;

export interface CategoryFilterOwner extends OBJIOItem {
  getColumn(): string;
  setCondition(cond: Condition): void;
  get(): DocTable;
}

export class CategoryFilter extends Base<DocTable, DocLayout> implements CondHolderOwner, CategoryFilterOwner {
  private condHolder = new CondHolder();
  private impl = new CategoryFilterImpl(this);

  getCondHolder(): CondHolder {
    return this.condHolder;
  }

  getColumn(): string {
    return this.column || this.source.getAllColumns()[0].name;
  }

  setColumn(name: string): boolean {
    if (!super.setColumn(name))
      return false;

    this.impl.updateSubtable();
    return true;
  }

  getColumns(): Array<ColumnAttr> {
    return this.source.getAllColumns();
  }

  setCondition(cond: Condition): void {
    this.condHolder.setCondition(this.source, cond, this.layout.getObjects().getArray(), this);
  }

  getTotalRows(): number {
    return this.impl.getTotalRows();
  }

  getRender() {
    return this.impl.getRender();
  }
}

export class CategoryFilterImpl<TCategoryFilterOwner extends CategoryFilterOwner = CategoryFilterOwner> {
  protected owner: TCategoryFilterOwner;
  private render = new RenderListModel(0, 20);
  private lastLoadTimer: Cancelable;
  private subtable: string;
  private colsToRender = Array<ColumnAttr>();
  private rowsNum: number = 0;
  private rowsCache: {[rowIdx: string]: string} = {};
  private sel = Array<string>();
  private excludeSel = new Set<string>();

  constructor(object: TCategoryFilterOwner) {
    this.owner = object;

    this.render.setHandler({
      loadItems: (first, count) => {
        if (this.lastLoadTimer) {
          this.lastLoadTimer.cancel();
          this.lastLoadTimer = null;
        }

        this.lastLoadTimer = ExtPromise().cancelable( ExtPromise().timer(TIME_BETWEEN_REQUEST) );
        return this.lastLoadTimer.then(() => {
          this.lastLoadTimer = null;

          const args: LoadCellsArgs = { first, count };
          if (this.subtable)
            args.table = this.subtable;

          return this.getSource().getTableRef().loadCells(args);
        });
      }
    });

    this.owner.holder.addEventHandler({
      onLoad: this.onInit,
      onCreate: this.onInit,
      onObjChange: this.updateSubtable
    });
  }

  getSource(): DocTable {
    return this.owner.get();
  }

  updateCondition() {
    this.sel = this.render.getSel().map(rowIdx => {
      return this.rowsCache[rowIdx] || (
        this.rowsCache[rowIdx] = this.render.getItems(+rowIdx, 1)[0][0] as string
      );
    });

    const column = this.owner.getColumn();
    if (this.sel.length + this.excludeSel.size == 0) {
      this.setCondition(null);
    } else if (this.sel.length == 1 && this.excludeSel.size == 0) {
      this.setCondition({ column, value: this.sel[0] });
    } else if (this.sel.length == 0 && this.excludeSel.size == 1) {
      this.setCondition({ column, inverse: true, value: Array.from(this.excludeSel)[0]});
    } else {
      const cond: Condition = { op: 'or', values: this.sel.map(value => ({ column, value }))};
      const exclude: Condition = {
        op: 'and',
        values: Array.from(this.excludeSel).map(value => {
          return { column, inverse: true, value };
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
    this.owner.setCondition(cond);
  }

  onInit = () => {
    this.render.setHeader(false);
    this.updateSubtable();

    this.render.subscribe(() => {
      this.updateCondition();
    }, 'select-row');

    return Promise.resolve();
  }

  updateSubtable = () => {
    return this.owner.get().getTableRef().createSubtable({
      distinct: { column: this.owner.getColumn() },
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
      this.owner.holder.notify();
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
    this.owner.holder.delayedNotify();
  }

  getRender(): RenderListModel {
    return this.render;
  }

  getColumnsToRender() {
    return this.colsToRender;
  }

  getTotalRows() {
    return this.rowsNum;
  }
}
