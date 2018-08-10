import {
  OBJIOItem,
  SERIALIZER,
  OBJIOArray,
  Publisher
} from 'objio';
import { DocDummy } from './doc-dummy';
import { DocHolder } from './doc-holder';
import { DocSpriteSheet } from './doc-sprite-sheet';
import { TreeModel, TreeItem } from 'ts-react-ui/model/tree';

export {
  DocDummy,
  DocHolder,
  DocSpriteSheet
};

export interface DocTreeItem extends TreeItem {
  doc?: DocHolder;
}

export class DocContainer extends OBJIOItem {
  private children = new OBJIOArray<DocHolder>();
  protected modifyTime: number = 0;
  protected tree = new TreeModel<DocTreeItem>();

  constructor() {
    super();

    this.holder.addEventHandler({
      onLoad: () => {

        this.children.holder.addEventHandler({
          onLoad: () => {
            this.updateTree();
            return Promise.resolve();
          },
          onObjChange: () => {
            this.updateTree();
          }
        });

        return Promise.resolve();
      }
    });
  }

  updateTree(select?: DocHolder) {
    let selItem: DocTreeItem;
    const docs = this.children.getArray();
    const makeItem = (doc: DocHolder): TreeItem => {
      const item = { doc, label: doc.getName() };
      if (select == doc)
        selItem = item;
      return item;
    };

    let root = Array<DocTreeItem>();
    const map: {[key: string]: DocTreeItem} = {};
    docs.forEach(doc => {
      let parent = map[doc.getTypePath().join('/')];
      if (!parent) {
        let path = '';
        doc.getTypePath().forEach((type, i) => {
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
  }

  getTree() {
    return this.tree;
  }

  append(doc: DocHolder): Promise<void> {
    return this.holder.createObject<DocHolder>(doc)
    .then(() => {
      this.children.push(doc).save();
      this.updateTree(doc);
      this.holder.notify();
    });
  }

  remove(item: DocTreeItem) {
    let idx = this.children.find(doc => doc == item.doc);
    if (idx == -1)
      return;

    this.children.remove(idx);
    this.children.getHolder().save();
    this.updateTree();
    this.holder.notify();
  }

  getDoc(idx: number): DocHolder {
    return this.children.get(idx);
  }

  getChildren(): OBJIOArray<DocHolder> {
    return this.children;
  }

  static TYPE_ID = 'DocContainer';
  static SERIALIZE: SERIALIZER = () => ({
    children: { type: 'object', classId: 'OBJIOArray' },
    modifyTime: { type: 'number' }
  });
}
