import { DataSourceHolder } from './doc-layout';
import { DocTable } from './doc-table';
import { SERIALIZER } from 'objio';

export class LayoutDataList<T extends DocTable = DocTable> extends DataSourceHolder<T> {
  protected column: string;

  static TYPE_ID = 'LayoutDataList';
  static SERIALIZE: SERIALIZER = () => ({
    ...DataSourceHolder.SERIALIZE(),
    column: { type: 'string' }
  });
}
