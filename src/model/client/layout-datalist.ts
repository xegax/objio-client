import { LayoutDataList as Base } from '../server/layout-datalist';
import { DocTable } from './doc-table';
import { ColumnAttr, LoadCellsArgs, SubtableAttrs, SortPair } from 'objio-object/table';
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
  private subtableArgs: string;
  private sort: SortPair;

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
    this.source.getState().holder.addEventHandler({
      onObjChange: () => this.holder.notify()
    });

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
      const args: Partial<SubtableAttrs> = {};
      const filter = this.layout.getCondition(this);
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
      if (this.colsToShow.length) {
        this.colsToRender = this.colsToRender.filter(col => {
          return this.colsToShow.indexOf(col.name) != -1;
        });
      }

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

  hideColumn(col: string) {
    if (this.getViewType() != 'table')
      return;

    if (this.colsToShow.length == 0)
      this.colsToShow = this.source.getAllColumns().map(col => col.name);

    this.colsToShow.splice(this.colsToShow.indexOf(col), 1);
    this.holder.save();
    this.subscriber();
  }

  showAllColumns() {
    if (this.getViewType() != 'table')
      return;

    this.colsToShow = [];
    this.holder.save();
    this.subscriber();
  }

  setSort(column: string, dir: 'asc' | 'desc') {
    this.sort = { column, dir };
    this.subscriber();
  }

  toggleSort(column: string) {
    if (this.sort && this.sort.column == column)
      this.sort.dir = this.sort.dir == 'asc' ? 'desc' : 'asc';
    else
      this.sort = { column, dir: 'asc' };
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
