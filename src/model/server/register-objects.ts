import { OBJIOFactory } from 'objio';
import { DocRoot } from './doc-root';
import { Animation, DocSpriteSheet } from '../doc-sprite-sheet';
import * as Objects from 'objio-object/server';

import { DocLayout, DataSourceHolder } from './doc-layout';
import { DrillDownTable } from './layout/drilldown-table';
import { CategoryFilter } from './layout/category-filter';
import { TagFilter } from './layout/tag-filter';
import { SelectDetails } from './layout/select-details';
import { RangeFilter } from './layout/range-filter';
import { DocVideo } from './doc-video';
import { DocHolder } from './doc-holder';
import * as MYSQL from 'objio-mysql-database/server';
import * as SQLITE3 from 'objio-sqlite-table/server';

export function registerObjects(fact: OBJIOFactory) {
  [
    ...Objects.getClasses(),
    ...SQLITE3.getClasses(),
    ...MYSQL.getClasses()
  ].forEach(classObj => {
    fact.registerItem(classObj);
  });

  fact.registerItem(DocHolder);
  fact.registerItem(Animation);
  fact.registerItem(DocRoot);
  fact.registerItem(DocSpriteSheet);
  fact.registerItem(DocLayout);
  fact.registerItem(DataSourceHolder);
  fact.registerItem(DrillDownTable);
  fact.registerItem(CategoryFilter);
  fact.registerItem(TagFilter);
  fact.registerItem(SelectDetails);
  fact.registerItem(RangeFilter);
  fact.registerItem(DocVideo);
}
