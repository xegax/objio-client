import { OBJIOFactory, SERIALIZER } from 'objio';
import { Table } from 'objio-sqlite-table';
import { TableHolder } from 'objio-object/server/table-holder';
import { FileObject } from 'objio-object/server/file-object';
import { DocProcess } from '../doc-process';
import { Animation } from '../doc-sprite-sheet';
import { DocContainer } from '../doc-container';
import { DocDummy } from '../doc-dummy';
import { DocTable } from './doc-table';
import { DocSpriteSheet } from '../doc-sprite-sheet';
import { StateObject } from 'objio-object/state-object';
import { DocHolder } from '../doc-holder';

class SrvDocProcess extends DocProcess {
  private timer: any;

  constructor() {
    super();
    this.holder.setMethodsToInvoke({
      'run': () => {
        if (this.timer)
          return console.log('already run');

        this.progress = 0;
        this.timer = setInterval(() => {
          this.progress = Math.min(1, this.progress + 0.05);
          if (this.progress == 1) {
            clearInterval(this.timer);
            this.timer = null;
          }

          this.holder.save();
        }, 100);
        console.log('run process');
        return {};
      }
    });
  }

  static SERIALIZE: SERIALIZER = () => ({
    ...DocProcess.SERIALIZE()
  });
}

class SrvAnimation extends Animation {
  specialField: string = new Date().toString();

  constructor() {
    super();
    console.log('SrvAnimation created', Date.now());
  }

  static SERIALIZE: SERIALIZER = () => ({
    ...Animation.SERIALIZE(),
    'specialField': {type: 'string', tags: ['sr']}
  });
}

export function registerObjects(fact: OBJIOFactory) {
  fact.registerItem(DocContainer);
  fact.registerItem(DocDummy);
  fact.registerItem(DocHolder);
  fact.registerItem(DocSpriteSheet);
  fact.registerItem(Table);
  fact.registerItem(TableHolder);
  fact.registerItem(FileObject);
  fact.registerItem(StateObject);
  fact.registerItem(SrvAnimation);
  fact.registerItem(SrvDocProcess);
  fact.registerItem(DocTable);
}
