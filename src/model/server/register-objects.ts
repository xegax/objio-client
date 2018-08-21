import { OBJIOFactory } from 'objio';
import { Table } from 'objio-sqlite-table';
import { FileObject } from 'objio-object/server/file-object';
import { DocContainer } from './doc-container';
import { DocTable } from './doc-table';
import { Animation, DocSpriteSheet } from '../doc-sprite-sheet';
import { StateObject } from 'objio-object/state-object';
import { DocHolder } from './doc-holder';
import { CSVFileObject } from 'objio-object/server/csv-file-object';
import { FileObjImpl } from 'objio-object/file-obj-impl';
import { DocLayout, DataSourceHolder } from './doc-layout';
import { DrillDownTable } from './layout/drilldown-table';
import { CategoryFilter } from './layout/category-filter';
import { TagFilter } from './layout/tag-filter';
import { SelectDetails } from './layout/select-details';
import { RangeFilter } from './layout/range-filter';

export function registerObjects(fact: OBJIOFactory) {
  fact.registerItem(Animation);
  fact.registerItem(DocContainer);
  fact.registerItem(DocHolder);
  fact.registerItem(DocSpriteSheet);
  fact.registerItem(Table);
  fact.registerItem(FileObject);
  fact.registerItem(StateObject);
  fact.registerItem(DocTable);
  fact.registerItem(CSVFileObject);
  fact.registerItem(FileObjImpl);

  fact.registerItem(DocLayout);
  fact.registerItem(DataSourceHolder);
  fact.registerItem(DrillDownTable);
  fact.registerItem(CategoryFilter);
  fact.registerItem(TagFilter);
  fact.registerItem(SelectDetails);
  fact.registerItem(RangeFilter);
}
