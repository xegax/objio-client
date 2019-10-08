import * as React from 'react';
import { DocRootBase } from '../base/doc-root';
import { OBJIOItemClass } from 'objio';
import { ObjectBase } from 'objio-object/base/object-base';
import { DocHolderBase } from '../base/doc-holder';
import { createFileObject } from 'objio-object/client';
import { DocHolder } from './doc-holder';

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

export class App extends DocRootBase {
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
      onObjChange: () => this.updateObjTree(),
      onLoad: () => {
        this.updateObjTree();
        this.onHashChanged();
        return Promise.resolve();
      }
    });

    App.hashState.subscribe(this.onHashChanged);
  }

  static setSelectById(objId: string) {
    App.hashState.pushState({ objId });
  }

  protected onHashChanged = () => {
    this.setSelectById(App.hashState.getString('objId'));
  };

  setTypeMap(map: ObjTypeMap) {
    this.objTypeMap = map;
    // this.updateObjList(true);
  }

  private loadObjChildren = (item: TreeItem): Promise<Array<TreeItemExt>> => {
    return (
      this.holder.getObject(item.value)
      .then((obj: ObjectBase) => {
        const children = obj.getChildren();
        if (children && children[0]) {
          return children[0].objects.map(obj => ({
            value: obj.getID(),
            obj,
            render: this.renderTreeItem
          }));
        }

        return [];
      })
    );
  }

  private renderTreeItem = (item: TreeItemExt) => {
    return item.obj.getName();
  };

  private updateObjTree() {
    this.objTree = this.getObjects().map(holder => {
      return {
        value: holder.getID(),
        obj: holder,
        render: this.renderTreeItem,
        children: holder.getChildNum() ? this.loadObjChildren : undefined
      };
    });
    this.holder.delayedNotify();
  }

  /*private updateObjList(force?: boolean) {
    const objs: Array<{ ref: ObjectBase, parent: ObjectBase }> = this.getObjects().map(holder => ({ ref: holder, parent: null }));

    Object.keys(this.openObjects).forEach(id => {
      if (!this.openObjects[id])
        return;

      let idx = objs.findIndex(obj => obj.ref.holder.getID() == id);
      const parent = objs[idx].ref;
      if (!parent || !parent.getChildNum())
        return;

      const children = parent.getChildren();
      if (!children.length)
        return;

      const lst = children[0].objects.map(obj => ({ parent, ref: obj }));
      objs.splice(idx + 1, 0, ...lst);
    });
  
    if (force != true && objs.length == this.objectsToRender.length) {
      if (!this.objectsToRender.some(item => item.object.getVersion() != item.version))
        return;
    }

    this.objectsToRender = objs.map(obj => {
      const base = obj.ref;
      const name = base.getName();

      const viewable = this.objTypeMap[base.getObjType()];
      let icon: JSX.Element;
      if (viewable && viewable.getViewDesc) {
        icon = ({...viewable.getViewDesc()}.icons || {}).item;
      }

      const openFolder = (
        <CheckIcon
          hidden={base.getChildNum() == 0}
          value
          faIcon={!this.openObjects[base.holder.getID()] ? 'fa fa-plus' : 'fa fa-minus'}
          onClick={e => {
            e.stopPropagation();
            this.openObjects[base.holder.getID()] = !this.openObjects[base.holder.getID()];
            if (base instanceof DocHolderBase && !base.isLoaded())
              base.load().then(() => this.updateObjList(true));
            else
              this.updateObjList(true);
          }}
        />
      );
 
      return {
        value: base.getID(),
        title: name,
        version: base.getVersion(),
        render: (
          <>
            <Draggable
              data={{id: base.getID()}}
              type='layout'
              onDragStart={() => {
                if (base instanceof DocHolderBase)
                  base.load();
              }}
            >
              <div
                className='horz-panel-1'
                style={{display: 'flex', alignItems: 'center'}}
                onContextMenu={evt => {
                  if (obj.parent)
                    return;

                  evt.preventDefault();
                  evt.stopPropagation();

                  ContextMenu.show(
                    <Menu>
                      <MenuItem
                        text={`Remove "${obj.ref.getName()}"`}
                        onClick={() => {
                          this.remove({ obj: obj.ref as DocHolderBase, confirm: true });
                        }}
                      />
                    </Menu>,
                    { left: evt.pageX, top: evt.pageY }
                  );
                }}
              >
                {openFolder}
                <span style={!obj.parent ? {display: 'none'} : {}}></span>
                {icon || <Icon src={UnknownTypeIcon}/>}
                <span>{name}</span>
              </div>
            </Draggable>
          </>
        ),
        object: obj.ref,
        parent: obj.parent
      };
    });

    // this.objectVers = objs.map(obj => getObjectBase(obj.obj).holder.getVersion());
    this.holder.delayedNotify();
  }*/

  append(obj: DocHolderBase): Promise<void> {
    return (
      this.holder.createObject(obj)
      .then(() => {
        this.objects.push(obj);
        this.objects.holder.save();

        this.holder.save();
        this.holder.delayedNotify();
        App.setSelectById(obj.getID());
      })
    );
  }

  getObjTree() {
    return this.objTree;
  }

  selectObjectSubscriber = () => {
    this.holder.notify();
  }
  
  protected setSelectById(objId: string): void {
    if (!objId)
      return this.setSelect(null);

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

  getSelect() {
    return this.select.slice().reverse()[0];
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

  remove(args: { obj: DocHolderBase, removeContent?: boolean, confirm?: boolean }): Promise<boolean> {
    if (!args.confirm)
      return Promise.resolve(this.removeImpl({ obj: args.obj, removeContent: args.removeContent }));
    
    return (
      confirm({ body: `Are you sure to delete "${args.obj.getName()}"? `, actions: [ DeleteAll, DeleteOnlyObject, Cancel ] })
      .then(a => {
        if (a == Cancel)
          return;

        return this.removeImpl({ obj: args.obj, removeContent: a == DeleteAll });
      })
    );
  }

  private removeImpl(args: { obj: DocHolderBase, removeContent?: boolean }): boolean {
    const idx = this.objects.find(holder => holder == args.obj);
    if (idx == -1)
      return false;

    this.objects.remove(idx);
    if (args.removeContent && args.obj.get())
      args.obj.removeContent();

    this.objects.holder.save();
    if (args.obj == this.select[0])
        this.setSelectById('');

    this.holder.delayedNotify();
    return true;
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
      p = this.append(new DocHolder({ doc }));
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
