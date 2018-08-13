import { LayoutDataList as Base } from '../server/layout-datalist';
import { DocTable } from './doc-table';
import { ColumnAttr } from 'objio-object/table';
import { RenderListModel } from 'ts-react-ui/list';
import { cancelable, Cancelable, timer } from 'objio/common/promise';

export class LayoutDataList extends Base<DocTable> {
  private render = new RenderListModel(0, 20);
  private lastLoadTimer: Cancelable;
  private maxTimeBetweenRequests: number = 300;
  private subtable: string;
  private colsToRender = Array<ColumnAttr>();
  private rowsNum: number = 0;

  constructor(args) {
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
          return this.source.getTableRef().loadCells({ table: this.subtable, first: from, count });
        });
      }
    });

    this.holder.addEventHandler({
      onLoad: this.updateSubtable,
      onCreate: this.updateSubtable,
      onObjChange: this.updateSubtable
    });
  }

  updateSubtable = () => {
    return this.source.getTableRef().createSubtable({
      distinct: { column: this.getColumn() },
      sort: [{ column: 'count', dir: 'desc' }]
    }).then(res => {
      this.colsToRender = res.columns;
      this.subtable = res.subtable;
      this.rowsNum = res.rowsNum;
    }).then(() => {
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
