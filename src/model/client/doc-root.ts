import { DocRoot as Base } from '../server/doc-root';
import { FileObject } from 'objio-object/client/file-object';
import { DocHolder } from './doc-holder';
import { TreeModel, TreeItem } from 'ts-react-ui/model/tree';
import { OBJIOItem, OBJIOArray } from 'objio';
import { CSVFileObject } from 'objio-object/client/csv-file-object';
import { VideoFileObject } from 'objio-object/client/video-file-object';

export interface DocTreeItem extends TreeItem {
  obj?: DocHolder | FileObject;
}

export class DocRoot extends Base {
  protected tree = new TreeModel<DocTreeItem>();
  protected select: OBJIOItem;

  constructor() {
    super();

    this.holder.addEventHandler({
      onLoad: () => {
        this.updateTree();

        this.files.holder.addEventHandler({
          onObjChange: this.updateTree
        });

        this.docs.holder.addEventHandler({
          onObjChange: this.updateTree
        });

        return Promise.resolve();
      }
    });

    this.tree.subscribe(() => {
      const sel = this.tree.getSelect();
      if (!sel.obj)
        return;

      this.setSelect(sel.obj);
    }, 'select');
  }

  getFiles(): Array<FileObject> {
    return this.files.getArray();
  }

  getDocs(): Array<DocHolder> {
    return this.docs.getArray();
  }

  append(obj: FileObject | DocHolder): Promise<void> {
    return (
      this.holder.createObject(obj)
      .then(() => {
        if (obj instanceof FileObject) {
          this.files.push(obj);
          this.files.holder.save();
        } else if (obj instanceof DocHolder) {
          this.docs.push(obj);
          this.docs.holder.save();
        }
        this.holder.save();
        this.holder.delayedNotify();
        this.setSelect(obj);
        this.updateTree();
      })
    );
  }

  remove(obj: OBJIOItem): void {
    const srcs = [this.files, this.docs];
    srcs.some((lst: OBJIOArray<OBJIOItem>) => {
      const idx = lst.find(item => item == obj);
      if (idx == -1)
        return false;

      lst.remove(idx);
      lst.holder.save();
      return true;
    });

    if (obj == this.getSelect())
      this.setSelect(null);

    this.updateTree();
    this.holder.delayedNotify();
  }

  setSelect(select: OBJIOItem) {
    if (this.select == select)
      return;

    this.select = select;
    this.holder.delayedNotify();
  }

  getSelect(): OBJIOItem {
    return this.select;
  }

  exists(objs: Array<OBJIOItem>): boolean {
    const arr = [
      ...this.files.getArray(),
      ...this.docs.getArray(),
      ...this.docs.getArray().map(holder => holder.getDoc())
    ];
  
    return !!arr.find(obj => objs.indexOf(obj) != -1);
  }

  protected getPathOf(obj: OBJIOItem): Array<string> {
    let path = [];
    if (obj instanceof FileObject) {
      path.push('files');

      if (obj instanceof CSVFileObject) {
        path.push('csv');
      } else if (obj instanceof VideoFileObject) {
        path.push('video');
      } else if (['jpg', 'png', 'gif'].indexOf(obj.getExt().toLowerCase())) {
        path.push('images');
      }
    } else if (obj instanceof DocHolder) {
      path.push('docs');
      path.push(...obj.getPath());
    }

    return path;
  }

  updateTree = () => {
    let selItem: DocTreeItem;
    const docs = [ ...this.files.getArray(), ...this.docs.getArray() ];

    const makeItem = (obj: DocHolder | FileObject): DocTreeItem => {
      let label = '';
      if (obj instanceof DocHolder) {
        label = obj.getDoc().getName();
      } else if (obj instanceof FileObject) {
        label = obj.getName();
      }

      const item: DocTreeItem = {
        obj,
        label
      };

      if (obj == this.select)
        selItem = item;

      return item;
    };

    let root = Array<DocTreeItem>();
    const map: {[key: string]: DocTreeItem} = {};
    docs.forEach(doc => {
      const pathArr = this.getPathOf(doc);
      let parent = map[pathArr.join('/')];
      if (!parent) {
        let path = '';
        pathArr.forEach((type, i) => {
          if (path)
            path += '/';
          path += type;

          const prev = parent;
          if (parent = map[path])
            return;

          const newFolder = {
            label: type,
            open: true,
            children: []
          };
          if (i == 0)
            root.push(newFolder);

          if (prev)
            prev.children.push(newFolder);

          map[path] = newFolder;
          parent = newFolder;
        });
      }
      parent.children.push(makeItem(doc));
    });

    const sort = (root: Array<DocTreeItem>) => {
      root.sort((a, b) => {
        return (a.label as string).localeCompare(b.label as string);
      });
      root.forEach(item => {
        if (!item.children)
          return;
        sort(item.children);
      });
    }
    sort(root);
    this.tree.setItems(root);

    if (selItem)
      this.tree.setSelect(selItem);

    this.holder.delayedNotify();
  }

  getTree() {
    return this.tree;
  }
}
