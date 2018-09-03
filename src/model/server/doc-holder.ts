import { OBJIOItem, SERIALIZER, OBJIOItemClass } from 'objio';
import { DocTable } from 'objio-object/server/doc-table';
import { DocLayout } from './doc-layout';
import { ObjectBase } from 'objio-object/server/object-base';

export interface DocHolderArgs<T = ObjectBase> {
  path?: Array<string>;
  doc: T;
}

export class DocHolder<T = ObjectBase> extends OBJIOItem {
  protected path: Array<string> = [];
  protected doc: T;

  constructor(args?: DocHolderArgs<T>) {
    super();

    if (!args)
      return;

    this.path = (args.path || this.path).slice();
    this.doc = args.doc;
  }

  getPath(): Array<string> {
    return this.path;
  }

  getDoc(): T {
    return this.doc;
  }

  execute<T = Object>(args: Object): Promise<any> {
    if (typeof this.doc['execute'] != 'function')
      throw 'execute not implemented';

    return this.doc['execute'](args);
  }

  static TYPE_ID = 'DocHolder';
  static SERIALIZE: SERIALIZER = () => ({
    path: {type: 'json'},
    doc: {type: 'object'}
  });
}
