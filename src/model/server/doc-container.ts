import {
  OBJIOItem,
  SERIALIZER,
  OBJIOArray
} from 'objio';
import { DocHolder } from './doc-holder';

export class DocContainer extends OBJIOItem {
  protected children = new OBJIOArray<DocHolder>();
  protected select: DocHolder;

  setSelect(select: DocHolder) {
    if (this.select == select)
      return;
    this.select = select;
    this.holder.delayedNotify();
  }

  getSelect(): DocHolder {
    return this.select;
  }

  getDoc(idx: number): DocHolder {
    return this.children.get(idx);
  }

  getChildren(): OBJIOArray<DocHolder> {
    return this.children;
  }

  static TYPE_ID = 'DocContainer';
  static SERIALIZE: SERIALIZER = () => ({
    children: { type: 'object', classId: 'OBJIOArray' }
  });
}
