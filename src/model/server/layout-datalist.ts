import { DataSourceHolder, DocLayout } from './doc-layout';
import { DocTable } from './doc-table';
import { SERIALIZER } from 'objio';

export class LayoutDataList<
    TSource extends DocTable = DocTable,
    TLayout extends DocLayout = DocLayout
  > extends DataSourceHolder<TSource, TLayout> {

  protected column: string;

  static TYPE_ID = 'LayoutDataList';
  static SERIALIZE: SERIALIZER = () => ({
    ...DataSourceHolder.SERIALIZE(),
    column: { type: 'string' }
  });
}
