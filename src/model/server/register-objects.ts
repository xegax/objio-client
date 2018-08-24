import { OBJIOFactory } from 'objio';
import { Table } from 'objio-sqlite-table';
import { DocRoot } from './doc-root';
import { DocTable } from './doc-table';
import { Animation, DocSpriteSheet } from '../doc-sprite-sheet';
import { StateObject } from 'objio-object/state-object';
import { DocHolder } from './doc-holder';

import { FileObject } from 'objio-object/server/file-object';
import { CSVFileObject } from 'objio-object/server/csv-file-object';
import { VideoFileObject } from 'objio-object/server/video-file-object';

import { DocLayout, DataSourceHolder } from './doc-layout';
import { DrillDownTable } from './layout/drilldown-table';
import { CategoryFilter } from './layout/category-filter';
import { TagFilter } from './layout/tag-filter';
import { SelectDetails } from './layout/select-details';
import { RangeFilter } from './layout/range-filter';
import { DocVideo } from './doc-video';

export function registerObjects(fact: OBJIOFactory) {
  fact.registerItem(Animation);
  fact.registerItem(DocRoot);
  fact.registerItem(DocHolder);
  fact.registerItem(DocSpriteSheet);
  fact.registerItem(Table);
  fact.registerItem(StateObject);
  fact.registerItem(DocTable);

  fact.registerItem(FileObject);
  fact.registerItem(CSVFileObject);
  fact.registerItem(VideoFileObject);

  fact.registerItem(DocLayout);
  fact.registerItem(DataSourceHolder);
  fact.registerItem(DrillDownTable);
  fact.registerItem(CategoryFilter);
  fact.registerItem(TagFilter);
  fact.registerItem(SelectDetails);
  fact.registerItem(RangeFilter);
  fact.registerItem(DocVideo);
}
