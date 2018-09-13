import { OBJIOFactory } from 'objio';
import { DocRoot } from './doc-root';
import { DocSpriteSheet, Animation } from '../doc-sprite-sheet';
import * as Objects from 'objio-object/client';
import { DocLayout } from './doc-layout';
import { DocHolder } from './doc-holder';
import { DataSourceHolder } from '../server/doc-layout';
import { CategoryFilter } from './layout/category-filter';
import { DrillDownTable } from './layout/drilldown-table';
import { TagFilter } from './layout/tag-filter';
import { SelectDetails } from './layout/select-details';
import { RangeFilter } from './layout/range-filter';
import { DocVideo } from './doc-video';
import * as SQLITE3 from 'objio-sqlite-table/client';
import * as MYSQL from 'objio-mysql-database/client';

export {
  DocHolder,
  DocSpriteSheet
};

export function registerObjects(fact: OBJIOFactory) {
  [
    ...Objects.getClasses(),
    ...SQLITE3.getClasses(),
    ...MYSQL.getClasses()
  ].forEach(classObj => {
    fact.registerItem(classObj);
  });

  fact.registerItem(DocHolder);
  fact.registerItem(DocRoot);
  fact.registerItem(DocHolder);
  fact.registerItem(DocSpriteSheet);
  fact.registerItem(Animation);

  fact.registerItem(DocLayout);
  fact.registerItem(DataSourceHolder);
  fact.registerItem(DrillDownTable);
  fact.registerItem(CategoryFilter);
  fact.registerItem(TagFilter);
  fact.registerItem(SelectDetails);
  fact.registerItem(RangeFilter);
  fact.registerItem(DocVideo);
}
