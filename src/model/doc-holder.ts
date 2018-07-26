import { OBJIOItem, SERIALIZER, OBJIOItemClass } from 'objio';

export interface DocHolderClass extends OBJIOItemClass {
}

export interface DocHolderArgs<T = OBJIOItem> {
  name?: string;
  path?: Array<string>;
  doc: T;
}

export class DocHolder<T = OBJIOItem> extends OBJIOItem {
  private path: Array<string> = [];
  private name: string = 'unnamed';
  private doc: T;

  constructor(args?: DocHolderArgs<T>) {
    super();

    if (!args)
      return;

    this.name = args.name || this.name;
    this.path = (args.path || this.path).slice();
    this.doc = args.doc;
  }

  getPath(): Array<string> {
    return this.path;
  }

  getName(): string {
    return this.name;
  }

  setName(name: string) {
    this.name = name;
    return this.getHolder();
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
    name: {type: 'string'},
    doc: {type: 'object'}
  });
}
