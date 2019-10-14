import * as React from 'react';
import { DocRootClient } from '../base/doc-root';
import { OBJIOItemClass } from 'objio';
import { ObjectBase } from 'objio-object/base/object-base';
import { DocHolderBase } from '../base/doc-holder';
import { createFileObject } from 'objio-object/client';

import { Draggable } from 'ts-react-ui/drag-and-drop';
import { OBJIOItemClassViewable, ViewDesc } from 'objio-object/view/config';
import { Icon } from 'ts-react-ui/icon';
import { CheckIcon } from 'ts-react-ui/checkicon';
import 'ts-react-ui/typings';
import * as UnknownTypeIcon from '../../images/unknown-type.png';
import { confirm, Action } from 'ts-react-ui/prompt';
import { ContextMenu, Menu, MenuItem } from 'ts-react-ui/blueprint';
import { HashState } from 'ts-react-ui/hash-state';
import { TreeItem } from 'ts-react-ui/tree/tree';

export interface TreeItemExt extends TreeItem {
  obj: ObjectBase;
  version: string;
  deleteable: boolean;
}

const DeleteAll: Action = {
  text: 'Delete all',
  onAction: () => {}
};

const DeleteOnlyObject: Action = {
  text: 'Delete object only',
  onAction: () => {}
};

const Cancel: Action = {
  text: 'Cancel',
  onAction: () => {}
};

interface UploadItem {
  file: File;
  dstObj?: ObjectBase;
  dstData?: any;
}

export interface AppendToUploadArgs {
  dstObj?: ObjectBase;
  files: Array<File>;
}

export interface ObjTypeMap {
  [type: string]: OBJIOItemClassViewable;
}

interface AppState {
  objId: string;
}

export class App extends DocRootClient {
  private select = Array<ObjectBase>();
  private path = Array<string>();
  // private objectsToRender = Array<ObjItem>();
  protected objTree = Array<TreeItemExt>();
  
  protected uploadQueue = new Array<UploadItem>();
  protected uploading: Promise<any>;
  protected totalFilesToUpload: number = 0;
  protected currFileProgress: number = 0;
  protected openObjects: {[objId: string]: boolean} = {};
  protected objTypeMap: ObjTypeMap = {};
  protected static hashState = new HashState<AppState>();

  constructor() {
    super();

    this.holder.addEventHandler({
      onLoad: () => {
        this.onLoad();
        return Promise.resolve();
      }
    });

    App.hashState.subscribe(this.onHashChanged);
  }

  protected onLoad() {
    this.updateObjTree();
    this.objects.holder.addEventHandler({
      onObjChange: () => {
        this.updateObjTree();
        this.onHashChanged();
      }
    });
    this.onHashChanged();
  }

  static setSelectById(objId: string) {
    App.hashState.pushState({ objId });
  }

  protected onHashChanged = () => {
    this.setSelectById(App.hashState.getString('objId'));
  };

  setTypeMap(map: ObjTypeMap) {
    this.objTypeMap = map;
    this.updateObjTree();
  }

  private getObjChildren = (obj: ObjectBase) => {
    const children = obj.getChildren();
    if (!children || !children[0])
      return undefined;

    return children[0].objects.map(obj => ({
        value: obj.getID(),
        icon: this.getObjIcon(obj),
        title: obj.getName(),
        obj,
        version: obj.holder.getVersion(),
        render: this.renderTreeItem,
        deleteable: false
      })
    );
  }

  private loadObjChildren = (item: TreeItem): Promise<Array<TreeItemExt>> => {
    return (
      this.holder.getObject(item.value)
      .then(this.getObjChildren)
    );
  }

  private renderTreeItem = (item: TreeItemExt) => {
    return (
      <span
        onContextMenu={evt => {
          if (!item.deleteable)
            return;

          evt.preventDefault();
          evt.stopPropagation();

          ContextMenu.show(
            <Menu>
              <MenuItem
                text={`Remove "${item.obj.getName()}"`}
                onClick={() => {
                  this.remove({ obj: item.obj });
                }}
              />
            </Menu>,
            { left: evt.pageX, top: evt.pageY }
          );
        }}
      >
      {item.obj.getName()}
      </span>
    );
  };

  private getObjIcon(holder: ObjectBase) {
    const viewable = this.objTypeMap[holder.getObjType()];
    let icon: JSX.Element;
    if (viewable && viewable.getViewDesc) {
      icon = ({...viewable.getViewDesc()}.icons || {}).item;
    }
    return icon;
  }

  private updateObjTree() {
    this.objTree = this.getObjects()
    .slice()
    .sort((a, b) => {
      if (a.getObjType() == b.getObjType())
        return a.getName().localeCompare(b.getName());

      return a.getObjType().localeCompare(b.getObjType());
    })
    .map(holder => {
      return {
        value: holder.getID(),
        icon: this.getObjIcon(holder),
        obj: holder,
        version: holder.getVersion(),
        deleteable: true,
        title: holder.getName(),
        render: this.renderTreeItem,
        children: holder.getChildNum() ? this.loadObjChildren : undefined
      };
    });
    this.holder.delayedNotify();
  }

  append(obj: ObjectBase): Promise<void> {
    return (
      this.holder.createObject(obj)
      .then(() => this.appendObj(obj.getID()))
      .then(() => App.setSelectById(obj.getID()))
    );
  }

  getObjTree() {
    const sel = this.getSelect();
    if (sel) {
      let change = 0;
      for (let n = 0; n < this.objTree.length; n++) {
        const item = this.objTree[n];
        if (item.obj.getID() == sel.getID() || item.version != item.obj.getVersion()) {
          item.version = item.obj.getVersion();
          item.children = this.getObjChildren(item.obj);
          change++;
        }
      }

      if (change)
        this.objTree = this.objTree.slice();
    }

    return this.objTree;
  }

  selectObjectSubscriber = () => {
    this.holder.notify();
  }
  
  protected setSelectById(objId: string): void {
    if (!objId)
      return this.setSelect([]);

    const objIdArr = objId.split(',');
    const objToSelIdx = this.objects.find(obj => obj.getID() == objIdArr[0]);
    if (objToSelIdx == -1)
      return;

    let holder: DocHolderBase = this.objects.get(objToSelIdx);
    const selectAll = () => {
      return holder.getChildren().some(c => {
        const child = c.objects.find(obj => obj.getID() == objIdArr[1]);
        if (!child)
          return false;

        this.setSelect([ holder, child ]);
        return true;
      });
    };

    if (!holder.isLoaded()) {
      holder.load().then(() => {
        if (!selectAll())
          this.setSelect([ holder ]);
      });
    } else {
      if (!selectAll())
        this.setSelect([ holder ]);
    }
  }

  protected setSelect(select: Array<ObjectBase>) {
    if (this.select[0]) {
      this.select[0].unsubscribe(this.selectObjectSubscriber);
    }

    this.select = select;
    this.path = select.map(obj => obj.getID());

    if (this.select[0]) {
      this.select[0].subscribe(this.selectObjectSubscriber);
    }

    this.holder.delayedNotify();
  }

  getSelect(): ObjectBase {
    return this.select[ this.select.length - 1 ];
  }

  getSelectPath() {
    return this.path;
  }

  appendToUpload(args: AppendToUploadArgs) {
    this.totalFilesToUpload += args.files.length;

    const newItems: Array<UploadItem> = args.files.map(item => {
      const uitem: UploadItem = {
        dstObj: args.dstObj,
        file: item
      };
      if (uitem.dstObj)
        uitem.dstData = uitem.dstObj.getFileDropDest();

      return uitem;
    });

    this.uploadQueue.push(...newItems);

    this.holder.delayedNotify();
    this.startUploadNext();
  }

  remove(args: { obj: ObjectBase, removeContent?: boolean }): Promise<boolean> {
    return (
      confirm({ body: `Are you sure to delete "${args.obj.getName()}"? `, actions: [ DeleteAll, DeleteOnlyObject, Cancel ] })
      .then(a => {
        if (a == Cancel)
          return;

        return this.removeObj({ id: args.obj.getID(), content: a == DeleteAll });
      })
    );
  }

  filterObjects = (filter?: Array<OBJIOItemClass>) => {
    return this.getObjects().filter(holder => {
      if (!filter || filter.length == 0)
        return true;

      const classObj: OBJIOItemClass = this.objTypeMap[holder.getObjType()];
      return filter.indexOf( classObj ) != -1;
    });
  }

  getUploadQueue() {
    return this.uploadQueue.slice();
  }

  getTotalFilesToUpload(): number {
    return this.totalFilesToUpload;
  }

  getCurrFileProgress(): number {
    return this.currFileProgress;
  }

  protected startUploadNext() {
    if (this.uploading || !this.uploadQueue.length)
      return;

    const item = this.uploadQueue[0];
    let doc: ObjectBase;

    let p: Promise<any>;
    if (!item.dstObj) {
      doc = createFileObject({
        name: item.file.name,
        size: item.file.size,
        mime: item.file.type
      });
      p = this.append(doc);
    } else {
      doc = item.dstObj;
      p = Promise.resolve();
    }

    this.uploading = (
      p.then(() => {
        this.holder.delayedNotify();
        return doc.sendFile({
          file: item.file,
          dest: item.dstData,
          onProgress: value => {
            this.currFileProgress = value;
            this.holder.delayedNotify();
          }
        });
      })
      .then(() => {
        this.uploadQueue.splice(0, 1);
        if (this.uploadQueue.length == 0)
          this.totalFilesToUpload = 0;

        this.uploading = null;
        this.holder.delayedNotify();
        this.startUploadNext();
      })
      .catch(err => {
        this.uploadQueue = [];
        this.totalFilesToUpload = 0;
        this.uploading = null;
        this.holder.delayedNotify();
        return Promise.reject(err);
      })
    );
  }
}
