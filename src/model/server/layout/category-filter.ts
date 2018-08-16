import { DataSourceHolder, DocLayout } from '../doc-layout';
import { DocTable } from '../doc-table';
import { SERIALIZER } from 'objio';

export class CategoryFilter<
    TSource extends DocTable = DocTable,
    TLayout extends DocLayout = DocLayout
  > extends DataSourceHolder<TSource, TLayout> {

  protected column: string;
  protected colsToShow = Array<string>();

  static TYPE_ID = 'CategoryFilter';
  static SERIALIZE: SERIALIZER = () => ({
    ...DataSourceHolder.SERIALIZE(),
    column: { type: 'string' },
    colsToShow: { type: 'json' }
  });
}