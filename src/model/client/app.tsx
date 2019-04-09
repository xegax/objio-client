import * as React from 'react';
import { DocRootBase } from '../base/doc-root';
import { FileObjectBase as FileObject } from 'objio-object/base/file-object';
import { OBJIOItemClass } from 'objio';
import { ObjectBase, ObjectsFolder } from 'objio-object/base/object-base';
import { DocHolderBase } from '../base/doc-holder';
import { SendFileArgs } from 'objio-object/client/files-container';
import { createFileObject } from 'objio-object/client';
import { DocHolder } from './doc-holder';

import { Draggable } from 'ts-react-ui/drag-and-drop';
import { OBJIOItemClassViewable, ViewDesc } from 'objio-object/view/config';
import { Icon } from 'ts-react-ui/icon';
import { CheckIcon } from 'ts-react-ui/checkicon';
import 'ts-react-ui/typings';
import * as UnknownTypeIcon from '../../images/unknown-type.png';
import { ListView } from 'ts-react-ui/list-view';

interface ObjItem {
  value: string;
  version: string;
  render: JSX.Element;
  object: ObjectBase;
}

interface UploadItem {
  file: File;
  dst?: ObjectBase;
}

export interface AppendToUploadArgs {
  dst?: ObjectBase;
  files: Array<File>;
}

export interface ObjTypeMap {
  [type: string]: OBJIOItemClassViewable;
}

export class App extends DocRootBase {
  private select: ObjectBase;
  private objectsToRender = Array<ObjItem>();
  
  protected uploadQueue = new Array<UploadItem>();
  protected uploading: Promise<any>;
  protected totalFilesToUpload: number = 0;
  protected currFileProgress: number = 0;
  protected openObjects: {[objId: string]: boolean} = {};
  protected objTypeMap: ObjTypeMap = {};

  constructor() {
    super();

    this.holder.addEventHandler({
      onObjChange: () => this.updateObjList(),
      onLoad: () => {
        this.updateObjList();
        return Promise.resolve();
      }
    });
  }

  setTypeMap(map: ObjTypeMap) {
    this.objTypeMap = map;
    this.updateObjList(true);
  }

  renderChildren(obj: ObjectBase): JSX.Element {
    const children = obj.getChildren();
    if (!this.openObjects[obj.holder.getID()] || children.length != 1)
      return null;

    return (
      <ListView
        maxHeight={200}
        values={children[0].objects.map(item => {
          return { value: item.holder.getID(), label: item.getName() };
        })}
      />
    );
  }

  private updateObjList(force?: boolean) {
    const objs: Array<{ ref: ObjectBase, root: boolean}> = this.getObjects().map(holder => ({ ref: holder, root: true }));

    Object.keys(this.openObjects).forEach(id => {
      if (!this.openObjects[id])
        return;

      let idx = objs.findIndex(obj => obj.ref.holder.getID() == id);
      const obj = objs[idx].ref;
      if (!obj || !obj.getChildNum())
        return;

      const children = obj.getChildren();
      if (!children.length)
        return;

      const lst = children[0].objects.map(obj => ({ root: false, ref: obj }));
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
              <div className='horz-panel-1' style={{display: 'flex', alignItems: 'center'}}>
                {openFolder}
                <span style={obj.root ? {display: 'none'} : {}}></span>
                {icon || <Icon src={UnknownTypeIcon}/>}
                <span>{name}</span>
              </div>
            </Draggable>
          </>
        ),
        object: obj.ref
      };
    });

    // this.objectVers = objs.map(obj => getObjectBase(obj.obj).holder.getVersion());
    this.holder.delayedNotify();
  }

  append(obj: DocHolderBase): Promise<void> {
    return (
      this.holder.createObject(obj)
      .then(() => {
        this.objects.push(obj);
        this.objects.holder.save();

        this.holder.save();
        this.holder.delayedNotify();
        this.setSelect(obj);
      })
    );
  }

  getObjectsToRender(): Array<ObjItem> {
    this.updateObjList();
    return this.objectsToRender;
  }

  selectObjectSubscriber = () => {
    this.holder.notify();
  }

  setSelect(select: ObjectBase) {
    if (this.select == select)
      return;

    if (this.select) {
      this.select.unsubscribe(this.selectObjectSubscriber);
    }

    this.select = select;
    if (select instanceof DocHolderBase && !select.isLoaded()) {
      select.load().then(() => {
        this.updateObjList(true);
        select.holder.delayedNotify();
        this.holder.delayedNotify();
      });
    }

    if (this.select) {
      this.select.subscribe(this.selectObjectSubscriber);
    }

    this.holder.delayedNotify();
  }

  getSelect() {
    return this.select;
  }

  appendToUpload(args: AppendToUploadArgs) {
    this.totalFilesToUpload += args.files.length;
    this.uploadQueue.push(...args.files.map(item => ({
      dst: args.dst,
      file: item
    })));
    this.holder.delayedNotify();
    this.startUploadNext();
  }

  remove(obj: DocHolderBase): void {
    const idx = this.objects.find(holder => holder == obj);
    if (idx != -1) {
      this.objects.remove(idx);
      this.objects.holder.save();
      if (obj == this.select)
        this.setSelect(null);
    }
    this.holder.delayedNotify();
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
    if (!item.dst) {
      doc = createFileObject({
        name: item.file.name,
        size: item.file.size,
        mime: item.file.type
      });
      p = this.append(new DocHolder({ doc }));
    } else {
      doc = item.dst;
      p = Promise.resolve();
    }

    this.uploading = (
      p.then(() => {
        this.holder.delayedNotify();
        return doc.sendFile({
          file: item.file,
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
    );
  }
}
