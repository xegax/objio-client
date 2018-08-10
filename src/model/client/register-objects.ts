import { OBJIOFactory } from 'objio';
import {
  DocContainer,
  DocDummy,
  DocHolder
} from '../doc-container';
import { DocSpriteSheet, Animation } from '../doc-sprite-sheet';
import { DocProcess } from '../doc-process';
import { Table } from 'objio-object/table';
import { FileObject } from 'objio-object/file-object';
import { FileObjImpl } from 'objio-object/file-obj-impl';
import { StateObject } from 'objio-object/state-object';
import { DocTable } from './doc-table';
import { CSVFileObject } from 'objio-object/csv-file-object';
import { DocLayout } from './doc-layout';
import { OBJHolder } from '../server/doc-layout';

export {
  DocContainer,
  DocDummy,
  DocHolder,
  DocSpriteSheet,
  Animation,
  DocProcess,
  DocTable
};

export function registerObjects(fact: OBJIOFactory) {
  fact.registerItem(DocContainer);
  fact.registerItem(DocDummy);
  fact.registerItem(DocHolder);
  fact.registerItem(DocSpriteSheet);
  fact.registerItem(Animation);
  fact.registerItem(DocProcess);
  fact.registerItem(Table);
  fact.registerItem(FileObject);
  fact.registerItem(StateObject);
  fact.registerItem(DocTable);
  fact.registerItem(CSVFileObject);
  fact.registerItem(FileObjImpl);
  fact.registerItem(DocLayout);
  fact.registerItem(OBJHolder);
}
