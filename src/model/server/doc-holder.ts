import { OBJIOItem, SERIALIZER, OBJIOItemClass } from 'objio';
import { DocTable } from './doc-table';
import { DocLayout } from './doc-layout';
import { FileObject } from 'objio-object/file-object';

export interface DocHolderClass extends OBJIOItemClass {
}

export interface DocHolderArgs<T = OBJIOItem> {
  name?: string;
  path?: Array<string>;
  doc: T;
}

export class DocHolder<T = OBJIOItem> extends OBJIOItem {
  protected path: Array<string> = [];
  protected name: string = 'unnamed';
  protected doc: T;

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

  getTypePath(): Array<string> {
    const path = [];
    if (this.doc instanceof FileObject) {
      path.push('files');

      if (this.doc.getExt() == '.csv')
        path.push('csv');

      if (['.png', '.gif', '.jpg', '.jpeg'].indexOf(this.doc.getExt()) != -1)
        path.push('images');

      if (['.mp4', '.avi'].indexOf(this.doc.getExt()) != -1)
        path.push('video');

      if (['.mp3', '.ogg'].indexOf(this.doc.getExt()) != -1)
        path.push('music');
    } else if (this.doc instanceof DocTable) {
      path.push('tables');
    } else if (this.doc instanceof DocLayout) {
      path.push('layout');
    }

    return path;
  }

  getName(): string {
    return this.name;
  }

  setName(name: string): void {
    if (this.name == name)
      return;

    this.name = name;
    this.holder.save();
    this.holder.delayedNotify();
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
