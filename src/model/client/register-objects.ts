import { OBJIOFactory } from 'objio';
import * as Objects from 'objio-object/client';
import * as SQLITE3 from 'objio-sqlite-table/client';
import * as MYSQL from 'objio-mysql-database/client';
import * as Layout from 'objio-layout/client';
import * as OBJIO from 'objio/project/client';
import { App } from './app';

export function registerObjects(fact: OBJIOFactory) {
  [
    ...OBJIO.getClasses(),
    ...Layout.getClasses(),
    ...Objects.getClasses(),
    ...SQLITE3.getClasses(),
    ...MYSQL.getClasses()
  ].forEach(classObj => {
    fact.registerItem(classObj);
  });

  fact.registerItem(App);
}
