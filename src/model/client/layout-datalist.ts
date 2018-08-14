import { LayoutDataList as Base } from '../server/layout-datalist';
import { DocTable } from './doc-table';
import { ColumnAttr, LoadCellsArgs, SubtableAttrs } from 'objio-object/table';
import { RenderListModel } from 'ts-react-ui/list';
import { cancelable, Cancelable, timer } from 'objio/common/promise';
import { DocLayout } from './doc-layout';
import { DataSourceHolderArgs } from '../server/doc-layout';

export class LayoutDataList extends Base<DocTable, DocLayout> {
  private render = new RenderListModel(0, 20);
  private lastLoadTimer: Cancelable;
  private maxTimeBetweenRequests: number = 300;
  private subtable: string;
  private colsToRender = Array<ColumnAttr>();
  private rowsNum: number = 0;
  private rowsCache: {[rowIdx: string]: string} = {};
  private sel = Array<string>();
  private cond: string;

  constructor(args: DataSourceHolderArgs<DocTable, DocLayout>) {
    super(args);

    this.render.setHandler({
      loadItems: (from, count) => {
        if (this.lastLoadTimer) {
          this.lastLoadTimer.cancel();
          this.lastLoadTimer = null;
        }

        this.lastLoadTimer = cancelable(timer(this.maxTimeBetweenRequests));
        return this.lastLoadTimer.then(() => {
          this.lastLoadTimer = null;

          const args: LoadCellsArgs = { first: from, count };
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

    this.holder.subscribe(this.subscriber);
  }

  onInit = () => {
    this.updateSubtable();
    if (this.getViewType() == 'table')
      return Promise.resolve();

    this.render.subscribe(() => {
      this.sel = this.render.getSel().map(rowIdx => {
        return this.rowsCache[rowIdx] || (
          this.rowsCache[rowIdx] = this.render.getItems(+rowIdx, 1)[0][0] as string
        );
      });
      if (this.sel.length == 0) {
        this.layout.setCondition(this, null);
      } else if (this.sel.length == 1) {
        this.layout.setCondition(this, { column: this.column, value: this.sel[0] });
      } else {
        this.layout.setCondition(this, { op: 'or', values: this.sel.map(value => ({ column: this.column, value }))});
      }
    }, 'select-row');

    return Promise.resolve();
  }

  subscriber = () => {
    if (this.viewType == 'table') {
      const filter = this.layout.getCondition(this);
      const newFilter = JSON.stringify(filter || {});
      if (this.cond == newFilter)
        return;
      this.cond = newFilter;

      const args: Partial<SubtableAttrs> = {};

      if (filter)
        args.filter = filter;

      this.source.getTableRef().createSubtable(args)
      .then(res => {
        this.subtable = res.subtable;
        this.rowsNum = res.rowsNum;
        this.rowsCache = {};
        this.sel = [];
        this.render.reload();
        this.holder.notify();
      });
    }
  };

  updateSubtable = () => {
    if (this.viewType == 'table') {
      this.colsToRender = this.source.getAllColumns();
      this.rowsNum = this.source.getTotalRowsNum();
      this.render.reload();
      this.holder.notify();
      return Promise.resolve();
    }

    return this.source.getTableRef().createSubtable({
      distinct: { column: this.getColumn() },
      sort: [{ column: 'count', dir: 'desc' }]
    }).then(res => {
      this.colsToRender = res.columns;
      this.subtable = res.subtable;
      this.rowsNum = res.rowsNum;
    }).then(() => {
      this.rowsCache = {};
      this.sel = [];
      this.render.reload();
      this.holder.notify();
    });
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
