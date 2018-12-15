import { OBJIOItem, SERIALIZER } from 'objio';
import { ObjectBase } from 'objio-object/base/object-base';

export interface DocHolderArgs<T extends ObjectBase = ObjectBase> {
  doc: T;
}

export class DocHolder<T extends ObjectBase = ObjectBase> extends OBJIOItem {
  protected doc: T;

  constructor(args?: DocHolderArgs<T>) {
    super();

    if (args)
      this.doc = args.doc;
  }

  getDoc(): T {
    return this.doc;
  }

  static TYPE_ID = 'DocHolder';
  static SERIALIZE: SERIALIZER = () => ({
    doc: {type: 'object'}
  });
}
