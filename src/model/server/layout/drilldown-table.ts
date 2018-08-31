import { DataSourceHolder, DocLayout } from '../doc-layout';
import { DocTable } from 'objio-object/server/doc-table';
import { SERIALIZER } from 'objio';

export class DrillDownTable<
    TSource extends DocTable = DocTable,
    TLayout extends DocLayout = DocLayout
  > extends DataSourceHolder<TSource, TLayout> {

  protected idColumn: string;
  protected colsToShow = Array<string>();

  getIdColumn(): string {
    return this.idColumn;
  }

  setIdColumn(col: string): boolean {
    if (col == this.idColumn)
      return false;

    this.idColumn = col;
    this.holder.save();
    this.holder.delayedNotify();
    return true;
  }

  static TYPE_ID = 'DrillDownTable';
  static SERIALIZE: SERIALIZER = () => ({
    ...DataSourceHolder.SERIALIZE(),
    idColumn:     { type: 'string' },
    colsToShow:   { type: 'json' }
  });
}
