import { LayoutCont } from 'ts-react-ui/model/layout';
import { OBJIOItem, OBJIOArray, SERIALIZER } from 'objio';

export class OBJHolder extends OBJIOItem {
  private obj: OBJIOItem;

  constructor(obj: OBJIOItem) {
    super();
    this.obj = obj;
  }

  static TYPE_ID = 'OBJHolder';
  static SERIALIZE: SERIALIZER = () => ({
    obj: { type: 'object' }
  });

  get<T extends OBJIOItem>(): T {
    return this.obj as T;
  }
}

export class DocLayout extends OBJIOItem {
  protected layout: LayoutCont = {type: 'row', items: []};
  protected objects = new OBJIOArray<OBJHolder>();

  static TYPE_ID = 'DocLayout';
  static SERIALIZE: SERIALIZER = () => ({
    layout: { type: 'json' },
    objects: { type: 'object' }
  });
}