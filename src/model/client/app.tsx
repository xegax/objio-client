import * as React from 'react';
import { DocRoot as DocRootBase } from '../server/doc-root';
import { FileObjectBase as FileObject } from 'objio-object/base/file-object';
import { OBJIOItem, OBJIOArray } from 'objio';
import { ObjectBase, ObjectsFolder } from 'objio-object/base/object-base';
import { DocHolder } from './doc-holder';
import { SendFileArgs } from 'objio-object/client/files-container';
import { createFileObject } from 'objio-object/client';
export { DocRootBase as DocRoot };
import { Draggable } from 'ts-react-ui/drag-and-drop';
import { OBJIOItemClassViewable, ViewDesc } from 'objio-object/view/config';
import { Icon } from 'ts-react-ui/icon';
import { CheckIcon } from 'ts-react-ui/checkicon';
import 'ts-react-ui/typings';
import * as UnknownTypeIcon from '../../images/unknown-type.png';
import { ListView } from 'ts-react-ui/list-view';

export function getObjectBase(obj: DocHolder | FileObject): ObjectBase {
  if (obj instanceof DocHolder)
    return obj.getDoc();

  return obj;
}

interface ObjItem {
  value: string;
  render: JSX.Element;
  object: FileObject | DocHolder;
}

interface UploadItem {
  file: File;
  dst?: OBJIOItem;
}

export interface AppendToUploadArgs {
  dst?: OBJIOItem;
  files: Array<File>;
}

export class App extends DocRootBase {
  private select: FileObject | DocHolder;
  private objects = Array<ObjItem>();
  private objectVers = Array<string>();
  protected uploadQueue = new Array<UploadItem>();
  protected uploading: Promise<any>;
  protected totalFilesToUpload: number = 0;
  protected currFileProgress: number = 0;
  protected openObjects: {[objId: string]: boolean} = {};

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

  updateObjList(force?: boolean) {
    const objs = [...this.docs.getArray(), ...this.files.getArray()].map(obj => ({ obj, root: true }));
    Object.keys(this.openObjects).forEach(id => {
      if (!this.openObjects[id])
        return;

      let idx = objs.findIndex(obj => obj.obj.holder.getID() == id);
      const obj = objs[idx].obj;
      if (!obj)
        return;

      let children = obj.getChildren()[0].objects.map(obj => ({ root: false, obj })) as any;
      objs.splice(idx + 1, 0, ...children);
    });
  
    if (force != true && objs.length == this.objectVers.length) {
      if (!this.objectVers.some((id, idx) => {
        return getObjectBase(objs[idx].obj).holder.getVersion() != id;
      }))
        return;
    }

    this.objects = objs.map(obj => {
      const base = getObjectBase(obj.obj);
      const name = base.getName();
      const viewable = base.constructor as any as OBJIOItemClassViewable;
      let icon: JSX.Element;
      if (viewable.getViewDesc) {
        icon = ({...viewable.getViewDesc()}.icons || {}).item;
      }

      const children = base.getChildren();
      const openFolder = (
        <CheckIcon
          hidden={children.length == 0}
          value
          faIcon={!this.openObjects[base.holder.getID()] ? 'fa fa-plus' : 'fa fa-minus'}
          onChange={() => {
            this.openObjects[base.holder.getID()] = !this.openObjects[base.holder.getID()];
            this.updateObjList(true);
          }}
        />
      );
 
      return {
        value: base.holder.getID(),
        title: name,
        render: (
          <>
            <Draggable data={{id: base.holder.getID()}} type='layout'>
              <div className='horz-panel-1' style={{display: 'flex', alignItems: 'center'}}>
                {openFolder}
                <span style={obj.root ? {display: 'none'} : {}}></span>
                {icon || <Icon src={UnknownTypeIcon}/>}
                <span>{name}</span>
              </div>
            </Draggable>
          </>
        ),
        object: obj.obj
      };
    });

    this.objectVers = objs.map(obj => getObjectBase(obj.obj).holder.getVersion());
    this.holder.delayedNotify();
  }

  getObjectsBase(): Array<ObjectBase> {
    return [
      ...this.files.getArray(),
      ...this.docs.getArray().map(holder => holder.getDoc())
    ];
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
      })
    );
  }

  getObjects(): Array<ObjItem> {
    this.updateObjList();
    return this.objects;
  }

  selectObjectSubscriber = () => {
    this.holder.notify();
  }

  setSelect(select: FileObject | DocHolder) {
    if (this.select == select)
      return;

    if (this.select)
      getObjectBase(this.select).holder.unsubscribe(this.selectObjectSubscriber);

    this.select = select;
    if (this.select)
      getObjectBase(this.select).holder.subscribe(this.selectObjectSubscriber);
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

    this.holder.delayedNotify();
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
    let newFileObj: { sendFile(args: SendFileArgs): Promise<void> };

    let p: Promise<any>;
    if (!item.dst) {
      p = this.append(newFileObj = createFileObject({
        name: item.file.name,
        size: item.file.size,
        mime: item.file.type
      }));
    } else {
      newFileObj = item.dst as any;
      p = Promise.resolve();
    }

    this.uploading = (
      p.then(() => {
        this.holder.delayedNotify();
        return newFileObj.sendFile({
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
