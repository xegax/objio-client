import { DocRootBase, Folder } from '../base/doc-root';
import { DocHolder } from './doc-holder';
import { SERIALIZER, OBJIOArray } from 'objio';
import { ObjectBase } from 'objio-object/base/object-base';

function makeFolderId() {
  return (
    Math.random().toString(36).toUpperCase().substr(2)
  );
}

export class DocRoot extends DocRootBase {
  protected objects = new OBJIOArray<DocHolder>();
  protected root: Folder = { name: 'root', folders: {}, objects: [] };

  constructor() {
    super();

    this.holder.setMethodsToInvoke({
      appendObj: {
        method: (args: { id: string, path: Array<string> }) => this.appendObj(args),
        rights: 'write'
      },
      selectObject: {
        method: (args: { id: string }) => this.selectObject(args.id),
        rights: 'read'
      },
      removeObj: {
        method: (args: { id: string, content: boolean }) => this.removeObj(args),
        rights: 'write'
      },
      fetchTree: {
        method: () => this.fetchTree(),
        rights: 'read'
      },
      appendFolder: {
        method: (args: { name: string, path: Array<string> }) => this.appendFolder(args),
        rights: 'create'
      },
      removeFolder: {
        method: (args: { path: Array<string> }) => this.removeFolder(args.path),
        rights: 'write'
      },
      renameFolder: {
        method: (args: { name: string; path: Array<string> }) => this.renameFolder(args),
        rights: 'write'
      },
      moveObjsToFolder: {
        method: (args: { objIds: Array<string>; path: Array<string> }) => this.moveObjsToFolder(args),
        rights: 'write'
      },
      moveFolder: {
        method: (args: { src: Array<string>, dst: Array<string> }) => this.moveFolder(args),
        rights: 'write'
      }
    });

    this.holder.addEventHandler({
      onLoad: this.onLoad
    });
  }

  private someFolder(f: (f: Folder) => boolean | void, parent?: Folder): Folder {
    parent = parent || this.root;
    if (parent == this.root && f(this.root))
      return this.root;

    const keys = Object.keys(parent.folders);
    for (let n = 0; n < keys.length; n++) {
      let folder = parent.folders[keys[n]];
      if (f(folder))
        return folder;
    }

    for (let n = 0; n < keys.length; n++) {
      let folder = this.someFolder(f, parent.folders[keys[n]]);
      if (folder)
        return folder;
    }
    return null;
  }

  private onHolderChanged = (h: DocHolder) => {
    this.someFolder((f: Folder) => {
      const obj = (f.objects || []).find(obj => obj.id == h.getID());
      if (!obj)
        return false;

      obj.name = h.getName();
      return true;
    });
    this.holder.save(true);
  };

  private onLoad = () => {
    const notRoot = new Set<string>();

    const objsArr = this.objects.getArray();
    objsArr.forEach(h => {
      h.holder.addEventHandler({ onObjChange: () => this.onHolderChanged(h) });
    });

    this.someFolder((f: Folder) => {
      (f.objects || []).forEach(obj => {
        const holder = objsArr.find(h => h.getID() == obj.id);
        if (holder)
          obj.name = holder.getName();
      });

      if (f == this.root)
        return;

      for (let n = 0; n < f.objects.length; n++)
        notRoot.add(f.objects[n].id);
    });

    this.root.objects = [];
    this.objects.getArray()
    .forEach(obj => {
      const id = obj.getID();
      if (!notRoot.has(id))
        this.root.objects.push({
          id,
          name: obj.getName(),
          objType: obj.getObjType(),
          icon: obj.getIcon()
        });
    });

    return Promise.resolve();
  };

  appendObj(args: { id: string, path: Array<string> }) {
    const { folder } = this.findFolder(args.path);
    if (!folder)
      throw `folder ${args.path.join('-')} not found`;

    let holder: DocHolder;
    return (
      this.holder.getObject<ObjectBase>(args.id)
      .then(obj => {
        return this.holder.createObject(holder = new DocHolder({ doc: obj }));
      })
      .then(() => {
        folder.objects.push({
          id: args.id,
          name: holder.getName(),
          objType: holder.getObjType(),
          icon: holder.getIcon()
        });
        holder.holder.addEventHandler({ onObjChange: () => this.onHolderChanged(holder) });
        this.objects.push(holder);
        this.objects.holder.save();
        this.holder.save(true);
      })
    );
  }

  removeObj(args: { id: string; content: boolean }) {
    const i = this.objects.find(holder => {
      return holder.getID() == args.id;
    });
    if (i == -1)
      throw `object id=${args.id} not found`;

    const folder = this.someFolder(f => f.objects.some(obj => obj.id == args.id)); 
    let p = Promise.resolve();
    return (
      p.then(() => {
        if (folder)
          folder.objects = folder.objects.filter(obj => obj.id != args.id);
        this.objects.remove(i);
        this.objects.holder.save();
        this.holder.save(true);
      })
    );
  }

  fetchTree(): Promise<Folder> {
    return Promise.resolve(this.root);
  }

  moveObjsToFolder(args: { objIds: Array<string>, path: Array<string> }) {
    if (args.objIds.length == 0)
      throw 'objIds must be none emtpy array';

    const { folder } = this.findFolder(args.path);
    if (!folder)
      throw 'folder not found';

    let changed = 0;
    const objIds = new Set(args.objIds);
    this.someFolder(f => {
      const n = f.objects.findIndex(obj => objIds.has(obj.id));
      if (n == -1)
        return;

      changed++;
      const item = f.objects.splice(n, 1);
      folder.objects.push(item[0]);
      if (changed == args.objIds.length)
        return true;
    });

    this.holder.save(true);
  }

  appendFolder(args: { name: string, path: Array<string> }) {
    const { folder } = this.findFolder(args.path);
    if (!folder)
      throw 'folder not found';

    for (let n = 0; n < 100; n++) {
      const key = makeFolderId();
      if (!folder.folders[key]) {
        folder.folders[key] = {
          name: args.name,
          folders: {},
          objects: []
        };
        this.holder.save(true);
        return;
      }
    }

    throw 'folder could\'t be created';
  }

  removeFolder(path: Array<string>) {
    const { folder, parent } = this.findFolder(path);
    if (!folder)
      throw 'folder not found';

    parent.folders[ path[path.length - 1] ] = undefined;
    this.holder.save(true);
  }

  renameFolder(args: { name: string, path: Array<string> }) {
    const { folder } = this.findFolder(args.path);
    if (!folder)
      throw 'folder not found';

    folder.name = args.name;
    this.holder.save(true);
  }

  moveFolder(args: { src: Array<string>, dst: Array<string> }) {
    const src = this.findFolder(args.src);
    const dst = this.findFolder(args.dst);
    if (!src.folder)
      throw 'source folder not found';

    if (!dst.folder)
      throw 'destination folder not found';

    let srcKey = args.src[args.src.length - 1];
    delete src.parent.folders[srcKey];
    while (dst.folder.folders[srcKey]) {
      srcKey = makeFolderId();
    }
    dst.folder.folders[srcKey] = src.folder;
    this.holder.save(true);
  }

  selectObject(id: string) {
    const idx = this.objects.find(f => f.getID() == id);
    if (idx == -1)
      return;

    this.objects.get(idx).load();
  }

  private findFolder(path: Array<string>) {
    let parent: Folder = this.root;
    let folder: Folder = this.root;

    for (let n = 0; n < path.length; n++) {
      const key = path[n];
      folder = folder.folders[key];
      if (!folder)
        break;

      if (n + 1 != path.length)
        parent = folder;
    }

    return {
      folder,
      parent
    };
  }

  static SERIALIZE: SERIALIZER = () => ({
    objects:  { type: 'object', tags: [ 'sr' ] },
    root:     { type: 'json', tags: [ 'sr' ] }
  });
}
