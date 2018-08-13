import { SERIALIZER } from 'objio';
import { RenderListModel } from 'ts-react-ui/list';
import { timer, cancelable, Cancelable } from 'objio/common/promise';
import {
  CreateSubtableResult,
  ExecuteArgs,
  SubtableAttrs,
  ColumnAttr
} from 'objio-object/table';
import { DocTable as DocTableBase } from '../server/doc-table';

export class DocTable extends DocTableBase {
  private render = new RenderListModel(0, 20);
  private lastLoadTimer: Cancelable;
  private maxTimeBetweenRequests: number = 300;
  private totalRows: number = 0;
  private cols = Array<ColumnAttr>();

  constructor() {
    super();

    this.render.setHandler({
      loadItems: (from, count) => {
        if (this.lastLoadTimer) {
          this.lastLoadTimer.cancel();
          this.lastLoadTimer = null;
        }

        this.lastLoadTimer = cancelable(timer(this.maxTimeBetweenRequests));
        return this.lastLoadTimer.then(() => {
          this.lastLoadTimer = null;
          return this.table.loadCells({ first: from, count });
        });
      }
    });

    this.holder.addEventHandler({
      onLoad: () => {
        this.totalRows = this.table.getTotalRowsNum();
        this.cols = this.table.getColumns();
        this.holder.notify();
        return Promise.resolve();
      },
      onObjChange: () => {
        if (this.totalRows == this.table.getTotalRowsNum())
          return;

        this.totalRows = this.table.getTotalRowsNum();
        this.cols = this.table.getColumns();
        this.holder.notify();
      }
    });

    this.table.holder.addEventHandler({
      onObjChange: () => {
        if (!this.table.getState().isValid())
          return;
        this.totalRows = this.table.getTotalRowsNum();
        this.cols = this.table.getColumns();
        this.holder.notify();
      }
    });
  }

  getState() {
    return this.table.getState();
  }

  getTable(): string {
    return this.table.getTable();
  }

  getTableRef() {
    return this.table;
  }

  getFileObjId(): string {
    return this.table.getFileObjId();
  }

  getLastExecuteTime(): number {
    return this.table.getLastExecuteTime();
  }

  updateSubtable(args: Partial<SubtableAttrs>): Promise<CreateSubtableResult> {
    return this.table.createSubtable(args);
  }

  getTotalRowsNum(): number {
    return this.totalRows;
  }

  getColumns(): Array<ColumnAttr> {
    return this.cols;
  }

  getAllColumns(): Array<ColumnAttr> {
    return this.table.getColumns();
  }

  execute(args: ExecuteArgs): Promise<any> {
    this.render.clearCache(false);
    return this.table.execute(args);
  }

  getRender(): RenderListModel {
    return this.render;
  }

  static TYPE_ID = 'DocTable';
  static SERIALIZE: SERIALIZER = () => ({
    table: { type: 'object' }
  });
}
