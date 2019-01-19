import { SERIALIZER } from 'objio';
import { ObjectBase } from 'objio-object/base/object-base';

export interface DocHolderArgs {
  doc: ObjectBase;
}

export class DocHolder extends ObjectBase {
  protected doc: ObjectBase;

  constructor(args?: DocHolderArgs) {
    super();

    if (args)
      this.doc = args.doc;
  }

  getDoc(): ObjectBase {
    return this.doc;
  }

  static TYPE_ID = 'DocHolder';
  static SERIALIZE: SERIALIZER = () => ({
    doc: {type: 'object'}
  });
}
