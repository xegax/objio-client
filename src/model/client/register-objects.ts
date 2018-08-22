import { OBJIOFactory } from 'objio';
import { DocContainer } from './doc-container';
import { DocSpriteSheet, Animation } from '../doc-sprite-sheet';
import { Table } from 'objio-object/table';
import { FileObject } from 'objio-object/file-object';
import { FileObjImpl } from 'objio-object/file-obj-impl';
import { VideoFileObject } from 'objio-object/video-file-object';
import { StateObject } from 'objio-object/state-object';
import { DocTable } from './doc-table';
import { CSVFileObject } from 'objio-object/csv-file-object';
import { DocLayout } from './doc-layout';
import { DocHolder } from './doc-holder';
import { DataSourceHolder } from '../server/doc-layout';
import { CategoryFilter } from './layout/category-filter';
import { DrillDownTable } from './layout/drilldown-table';
import { TagFilter } from './layout/tag-filter';
import { SelectDetails } from './layout/select-details';
import { RangeFilter } from './layout/range-filter';

export {
  DocContainer,
  DocHolder,
  DocSpriteSheet,
  DocTable
};

export function registerObjects(fact: OBJIOFactory) {
  fact.registerItem(DocContainer);
  fact.registerItem(DocHolder);
  fact.registerItem(DocSpriteSheet);
  fact.registerItem(Animation);
  fact.registerItem(Table);
  fact.registerItem(FileObject);
  fact.registerItem(StateObject);
  fact.registerItem(DocTable);
  fact.registerItem(CSVFileObject);
  fact.registerItem(VideoFileObject);
  fact.registerItem(FileObjImpl);
  fact.registerItem(DocLayout);
  fact.registerItem(DataSourceHolder);
  fact.registerItem(DrillDownTable);
  fact.registerItem(CategoryFilter);
  fact.registerItem(TagFilter);
  fact.registerItem(SelectDetails);
  fact.registerItem(RangeFilter);
}
