import {
  OBJIOItem,
  SERIALIZER,
  OBJIOArray
} from 'objio';
import { DocHolder } from './doc-holder';

export class DocContainer extends OBJIOItem {
  protected children = new OBJIOArray<DocHolder>();

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
