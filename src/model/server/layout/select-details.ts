import { DocLayout, DataSourceHolder } from '../doc-layout';
import { DocTable } from '../doc-table';
import { SERIALIZER } from 'objio';

export interface FieldItem {
  name: string;     // column name
  value?: string;
  label?: string;
  discard?: boolean;
  image?: boolean;   // url pattern, %1 will be replaced with column data
}

export class SelectDetails<
  TSource extends DocTable = DocTable,
  TLayout extends DocLayout = DocLayout
> extends DataSourceHolder<TSource, TLayout> {
  protected idColumn: string;
  protected fieldsOrder = Array<FieldItem>();

  getIdColumn(): string {
    return this.idColumn;
  }

  setIdColumn(name: string): boolean {
    if (this.idColumn == name)
      return false;

    this.idColumn = name;
    this.holder.save();
    this.holder.delayedNotify();
    return true;
  }

  getFields(): Array<FieldItem> {
    return this.fieldsOrder;
  }

  save(item: FieldItem): void {
    if (this.fieldsOrder.indexOf(item) == -1)
      return;

    this.holder.save();
    this.holder.delayedNotify();
  }

  static TYPE_ID = 'SelectDetails';
  static SERIALIZE: SERIALIZER = () => ({
    ...DataSourceHolder.SERIALIZE(),
    idColumn:     { type: 'string' },
    fieldsOrder:  { type: 'json' }
  });
}
