import {
  OBJIOItem,
  SERIALIZER,
  OBJIOArray
} from 'objio';
import { DocHolder } from './doc-holder';
import { TreeModel, TreeItem } from 'ts-react-ui/model/tree';
import { DocContainer as Base } from '../server/doc-container';

export interface DocTreeItem extends TreeItem {
  doc?: DocHolder;
}

export class DocContainer extends Base {
  protected tree = new TreeModel<DocTreeItem>();

  constructor() {
    super();

    this.holder.addEventHandler({
      onLoad: () => {
        this.updateTree();

        this.children.holder.addEventHandler({
          onObjChange: () => {
            this.updateTree();
          }
        });

        return Promise.resolve();
      }
    });

    this.tree.subscribe(() => {
      this.setSelect(this.tree.getSelect().doc);
    }, 'select');
  }

  updateTree() {
    let selItem: DocTreeItem;
    const docs = this.children.getArray();
    const makeItem = (doc: DocHolder): TreeItem => {
      const item = { doc, label: doc.getName() };
      if (this.select == doc)
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

    this.holder.delayedNotify();
  }

  getTree() {
    return this.tree;
  }

  append(doc: DocHolder): Promise<void> {
    return this.holder.createObject<DocHolder>(doc)
    .then(() => {
      this.children.push(doc).save();
      this.updateTree();
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
}
