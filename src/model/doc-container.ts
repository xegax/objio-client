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
import { FileObject } from 'objio-object/file-object';
import { CSVFileObject } from 'objio-object/csv-file-object';
import { DocTable } from './server/doc-table';

export {
  DocDummy,
  DocHolder,
  DocSpriteSheet
};

export interface DocTreeItem extends TreeItem {
  doc: DocHolder;
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
    const makeItem = (doc: DocHolder): DocTreeItem => {
      const item = { doc, label: doc.getName() };
      if (select == doc)
        selItem = item;
      return item;
    };

    this.tree.setItems([
      {
        open: true,
        label: 'files',
        children: [
          {
            open: true,
            label: 'csv',
            children: docs.filter(doc => {
              const file = doc.getDoc() as FileObject;
              return file instanceof FileObject && file.getImpl() instanceof CSVFileObject;
            }).map(makeItem)
          }
        ]
      }, {
        open: true,
        label: 'tables',
        children: docs.filter(holder => {
          const table = holder.getDoc() as DocTable;
          return table instanceof DocTable;
        }).map(makeItem)
      }
    ]);

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

  remove(idx: number) {
    this.children.remove(idx);
    this.children.getHolder().save();
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
