import { OBJIOFactory } from 'objio';
import * as SQLITE3 from 'objio-sqlite-table/server';
import { DocRoot } from './doc-root';
import { Animation, DocSpriteSheet } from '../doc-sprite-sheet';
import * as Objects from 'objio-object/server';
import { DocHolder } from './doc-holder';

import { DocLayout, DataSourceHolder } from './doc-layout';
import { DrillDownTable } from './layout/drilldown-table';
import { CategoryFilter } from './layout/category-filter';
import { TagFilter } from './layout/tag-filter';
import { SelectDetails } from './layout/select-details';
import { RangeFilter } from './layout/range-filter';
import { DocVideo } from './doc-video';

export function registerObjects(fact: OBJIOFactory) {
  [
    ...Objects.getClasses(),
    ...SQLITE3.getClasses()
  ].forEach(classObj => {
    fact.registerItem(classObj);
  });
  fact.registerItem(Animation);
  fact.registerItem(DocRoot);
  fact.registerItem(DocHolder);
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
