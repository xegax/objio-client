import { OBJIOFactory } from 'objio';
import { DocRoot } from './doc-root';
import { DocSpriteSheet, Animation } from './sprite-sheet';
import * as Objects from 'objio-object/client';
import { DocHolder } from './doc-holder';
import { DocVideo } from './doc-video';
import * as SQLITE3 from 'objio-sqlite-table/client';
import * as MYSQL from 'objio-mysql-database/client';
import * as Layout from 'objio-layout/client';
import * as OBJIO from 'objio/object/client';
import { App } from './app';

export {
  DocHolder,
  DocSpriteSheet
};

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

  fact.registerItem(DocHolder);
  fact.registerItem(DocRoot);
  fact.registerItem(DocHolder);
  fact.registerItem(DocSpriteSheet);
  fact.registerItem(Animation);

  fact.registerItem(DocVideo);
  fact.registerItem(App);
}
