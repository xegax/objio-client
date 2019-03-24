import { OBJIOItem, SERIALIZER, OBJIOArray } from 'objio';
import { DocHolderBase } from './doc-holder';

export class DocRootBase extends OBJIOItem {
  protected objects = new OBJIOArray<DocHolderBase>();

  getObjects(): Array<DocHolderBase> {
    return this.objects.getArray();
  }

  static TYPE_ID = 'DocRoot';
  static SERIALIZE: SERIALIZER = () => ({
    objects:   { type: 'object' }
  });
}
