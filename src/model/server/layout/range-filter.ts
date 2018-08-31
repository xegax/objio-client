import { DataSourceHolder, DocLayout } from '../doc-layout';
import { DocTable } from 'objio-object/server/doc-table';
import { SERIALIZER } from 'objio';

export class RangeFilter<
    TSource extends DocTable = DocTable,
    TLayout extends DocLayout = DocLayout
  > extends DataSourceHolder<TSource, TLayout> {
  protected column: string;

  setColumn(name: string): boolean {
    if (name == this.column)
      return false;

    this.column = name;
    this.holder.save();
    this.holder.delayedNotify();
    return true;
  }

  getColumn(): string {
    return this.column;
  }

  static TYPE_ID = 'RangeFilter';
  static SERIALIZE: SERIALIZER = () => ({
    ...DataSourceHolder.SERIALIZE(),
    column:     { type: 'string' }
  });
}
