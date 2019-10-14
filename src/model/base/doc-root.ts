import { OBJIOItem, SERIALIZER, OBJIOArray } from 'objio';
import { DocHolderBase } from './doc-holder';

export abstract class DocRootBase extends OBJIOItem {
  protected objects = new OBJIOArray<DocHolderBase>();

  getObjects(): Array<DocHolderBase> {
    return this.objects.getArray();
  }

  abstract appendObj(id: string): void;
  abstract removeObj(args: { id: string, content: boolean }): void;

  static TYPE_ID = 'DocRoot';
  static SERIALIZE: SERIALIZER = () => ({
    objects:   { type: 'object', const: true }
  });
}

export class DocRootClient extends DocRootBase {
  appendObj(id: string) {
    return this.holder.invokeMethod({ method: 'appendObj', args: { id } });
  }

  removeObj(args: { id: string, content: boolean }) {
    return this.holder.invokeMethod({ method: 'removeObj', args });
  }
}
