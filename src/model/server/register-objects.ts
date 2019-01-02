import { OBJIOFactory } from 'objio';
import { DocRoot } from './doc-root';
import * as Objects from 'objio-object/server';
import { DocHolder } from './doc-holder';
import * as Layout from 'objio-layout/server';
import * as MYSQL from 'objio-mysql-database/server';
import * as SQLITE3 from 'objio-sqlite-table/server';

export function registerObjects(fact: OBJIOFactory) {
  [
    ...Layout.getClasses(),
    ...Objects.getClasses(),
    ...SQLITE3.getClasses(),
    ...MYSQL.getClasses()
  ].forEach(classObj => {
    fact.registerItem(classObj);
  });

  fact.registerItem(DocHolder);
  fact.registerItem(DocRoot);
}
