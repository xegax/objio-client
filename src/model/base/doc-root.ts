import { OBJIOItem, SERIALIZER } from 'objio';

export interface Item {
  id: string;
  name: string;
  objType: string;
}

export interface Folder {
  name: string;
  folders: {[key: string]: Folder};
  objects: Array<Item>;
}

export abstract class DocRootBase extends OBJIOItem {
  abstract selectObject(id: string): void;
  abstract appendObj(args: { id: string, path: Array<string> }): void;
  abstract removeObj(args: { id: string, content: boolean }): void;
  abstract fetchTree(): Promise<Folder>;

  abstract appendFolder(args: { name: string, path: Array<string> }): void;
  abstract removeFolder(path: Array<string>): void;
  abstract renameFolder(args: { name: string, path: Array<string> }): void;
  abstract moveObjsToFolder(args: { objIds: Array<string>, path: Array<string> }): void;
  abstract moveFolder(args: { src: Array<string>, dst: Array<string> }): void;

  static TYPE_ID = 'DocRoot';
  static SERIALIZE: SERIALIZER = () => ({});
}

export class DocRootClient extends DocRootBase {
  selectObject(id: string) {
    return this.holder.invokeMethod({ method: 'selectObject', args: { id } });
  }

  appendObj(args: { id: string, path: Array<string> }) {
    return this.holder.invokeMethod({ method: 'appendObj', args });
  }

  removeObj(args: { id: string, content: boolean }) {
    return this.holder.invokeMethod({ method: 'removeObj', args });
  }

  appendFolder(args: { name: string, path: Array<string> }) {
    return this.holder.invokeMethod({ method: 'appendFolder', args });
  }

  removeFolder(path: Array<string>) {
    return this.holder.invokeMethod({ method: 'removeFolder', args: { path } });
  }

  renameFolder(args: { name: string, path: Array<string> }) {
    return this.holder.invokeMethod({ method: 'renameFolder', args });
  }

  moveObjsToFolder(args: { objIds: Array<string>, path: Array<string> }) {
    return this.holder.invokeMethod({ method: 'moveObjsToFolder', args });
  }

  moveFolder(args: { src: Array<string>, dst: Array<string> }) {
    return this.holder.invokeMethod({ method: 'moveFolder', args });
  }

  fetchTree(): Promise<Folder> {
    return this.holder.invokeMethod({ method: 'fetchTree', args: {} });
  }
}
