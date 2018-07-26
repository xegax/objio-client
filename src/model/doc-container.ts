import {
  OBJIOItem,
  SERIALIZER,
  OBJIOArray,
  Publisher
} from 'objio';
import { DocDummy } from './doc-dummy';
import { DocHolder } from './doc-holder';
import { DocSpriteSheet } from './doc-sprite-sheet';

export {
  DocDummy,
  DocHolder,
  DocSpriteSheet
};

export class DocContainer extends OBJIOItem {
  private publisher = new Publisher();
  private children = new OBJIOArray<DocHolder>();
  protected modifyTime: number = 0;

  getPublisher() {
    return this.publisher;
  }

  async append(doc: DocHolder) {
    doc = await this.holder.createObject<DocHolder>(doc);
    this.children.push(doc).save();
    this.publisher.notify();
  }

  remove(idx: number) {
    this.children.remove(idx);
    this.children.getHolder().save();
    this.publisher.notify();
  }

  getDoc(idx: number): DocHolder {
    return this.children.get(idx);
  }

  getChildren(): OBJIOArray<DocHolder> {
    return this.children;
  }

  static TYPE_ID = 'DocContainer';
  static SERIALIZE: SERIALIZER = () => ({
    children: { type: 'object', classId: 'OBJIOArray' },
    modifyTime: { type: 'number' }
  });
}
