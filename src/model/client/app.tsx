import * as React from 'react';
import { DocRootClient, Folder } from '../base/doc-root';
import { OBJIOItemClass, FileSystemSimple } from 'objio';
import { ObjectBase, ObjInfoProv } from 'objio-object/base/object-base';
import { createFileObject } from 'objio-object/client';

import { OBJIOItemClassViewable } from 'objio-object/view/config';
import 'ts-react-ui/typings';
import { confirm, Action, OK } from 'ts-react-ui/prompt';
import { HashState } from 'ts-react-ui/hash-state';
import { TreeItem, updateValues } from 'ts-react-ui/tree/tree-model';
import { CSSIcon } from 'ts-react-ui/cssicon';
import { prompt } from 'ts-react-ui/prompt';
import { findItem, getPath } from 'ts-react-ui/tree/item-helpers';
import { PopoverIcon } from 'ts-react-ui/popover';
import { Menu, MenuItem } from '@blueprintjs/core';
import { createDocWizard } from '../../view/create-doc-wizard';
import { ObjectToCreate } from 'objio-object/common/interfaces';
import { uploadDialog } from 'ts-react-ui/upload';
import { IconMap } from 'ts-react-ui/common/icon-map';

export interface TreeItemExt extends TreeItem {
  parent?: TreeItemExt;
  type?: string;
  folder: boolean;
  deleteable?: boolean;
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
  path: string;
}

function sortFolders(item: TreeItemExt) {
  if (!item.folder || !Array.isArray(item.children))
    return;
  
  item.children.sort((a: TreeItemExt, b: TreeItemExt) => {
    if (a.folder && b.folder)
      return (a.title || '').toLowerCase().localeCompare((b.title || '').toLowerCase());

      if (a.folder && !b.folder)
        return -1;

    return 1;
  });
}

const CreateFolderIcon: React.SFC<{ app: App, path: string[] }> = props => {
  return (
    <CSSIcon
      icon='fa fa-plus'
      title='Create folder'
      showOnHover
      onClick={() => {
        prompt({ title: 'Create new folder', placeholder: 'folder name' })
        .then(name => {
          props.app.appendFolder({ name, path: props.path });
        });
      }}
    />
  );
}

function convertObjects(folder: Folder, app: App, parent: TreeItemExt): Array<TreeItemExt> {
  return (
    folder.objects.map(obj => {
      return {
        value: obj.id,
        render: obj.name,
        title: obj.name,
        folder: false,
        parent,
        type: obj.objType,
        icon: IconMap.render(obj.icon, 'blank-icon'),
        rightIcons: (
          <>
            <PopoverIcon icon='fa fa-ellipsis-h'>
              <Menu>
                <MenuItem
                  text='Upload'
                  onClick={() => {
                    Promise.all([uploadDialog({ multiple: true }), app.findObject(obj.id)])
                    .then(([files, dstObj]) => {
                      app.appendToUpload({ dstObj, files });
                    });
                  }}
                />
                <MenuItem
                  text='Remove'
                  onClick={() => {
                    confirm({ body: `Are you sure to delete "${obj.name}"? `, actions: [ DeleteAll, DeleteOnlyObject, Cancel ] })
                    .then(action => {
                      if (action != Cancel) {
                        app.deleteObject({ id: obj.id, content: action == DeleteAll });
                      }
                    });
                  }}
                />
              </Menu>
            </PopoverIcon>
          </>
        )
      };
    })
  );
}

function convertFolder(root: Folder, app: App, path?: Array<string>, parent?: TreeItemExt): Array<TreeItemExt> {
  path = path || [];
  const arr = (
    Object.keys(root.folders)
    .sort()
    .map(value => {
      const f = root.folders[value];
      const itemPath = [...path, value];
      const item: TreeItemExt = {
        parent,
        value,
        render: f.name,
        title: f.name,
        folder: true,
        children: [],
        rightIcons: (
          <>
            <PopoverIcon icon='fa fa-ellipsis-h'>
              <Menu>
                <MenuItem
                  text='Create object'
                  onClick={() => {
                    app.createObject();
                  }}
                />
                <MenuItem
                  text='Create folder'
                  onClick={() => {
                    prompt({ title: 'Create new folder', placeholder: 'Folder name' })
                    .then(name => {
                      app.appendFolder({ name, path: itemPath });
                    });
                  }}
                />
                <MenuItem
                  text='Rename folder'
                  onClick={() => {
                    prompt({
                      title: `Rename folder "${f.name}"`,
                      placeholder: 'New name',
                      value: f.name
                    })
                    .then(name => app.renameFolder({ name, path: itemPath }))
                  }}
                />
                <MenuItem
                  text='Upload files'
                  onClick={() => {
                    uploadDialog({ multiple: true })
                    .then(files => {
                      app.appendToUpload({ files });
                    });
                  }}
                />
                <MenuItem
                  text='Remove folder'
                  onClick={() => {
                    confirm({ body: 'Are you sure to delete folder?' })
                    .then(a => {
                      if (a == OK)
                        app.removeFolder(itemPath);
                    });
                  }}
                />
              </Menu>
            </PopoverIcon>
          </>
        )
      };

      item.children = convertFolder(root.folders[value], app, itemPath, item);
      return item;
    })
  );

  arr.push(...convertObjects(root, app, parent));
  return arr;
}

export class App extends DocRootClient {
  // путь до объекта включающий объект, включая root
  private path = Array< Array<string> >();
  // путь до каталога, где лежит объект, включая root
  private folderPath = Array< Array<string> >();

  protected objTree = Array<TreeItemExt>();
  protected objInfoProv = Array<ObjInfoProv>();
  
  protected uploadQueue = new Array<UploadItem>();
  protected uploading: Promise<any>;
  protected totalFilesToUpload: number = 0;
  protected currFileProgress: number = 0;
  protected openObjects: {[objId: string]: boolean} = {};
  protected objTypeMap: ObjTypeMap = {};
  protected static hashState = new HashState<AppState>();
  protected tree: Folder = { name: 'root', folders: {}, objects: [] };
  private selectObj: ObjectBase;
  private objLoadPromise?: Promise<void>;
  private objectsToCreate = Array<ObjectToCreate>();

  constructor() {
    super();

    let p: Promise<void>;
    this.holder.addEventHandler({
      onLoad: this.onLoad,
      onObjChange: () => {
        if (p)
          p.cancel();

        p = this.fetchTree()
        .then(tree => {
          this.updateObjTree(tree);
          this.onHashChanged();
        })
        .finally(() => {
          p = undefined;
        });
      }
    });

    App.hashState.subscribe(this.onHashChanged);
  }

  protected onLoad = () => {
    this.fetchTree()
    .then(tree => {
      this.updateObjTree(tree);
      this.onHashChanged();
    });

    return Promise.resolve();
  }

  static setSelectByObj(objId: string) {
    App.hashState.pushState({ objId, path: '' });
  }

  static setSelectByPath(path: string) {
    App.hashState.pushState({ objId: '', path });
  }

  setObjectsToCreate(objects: Array<ObjectToCreate>) {
    this.objectsToCreate = objects;
  }

  getObjectsToCreate() {
    return this.objectsToCreate;
  }

  protected onHashChanged = () => {
    this.setSelectByObjId(App.hashState.getString('objId'));
    this.setSelectByPath(App.hashState.getString('path'));
  };

  private setSelectByPath(path: string | undefined) {
    if (!path)
      return;

    this.path = [ path.split('-') ];
    this.folderPath = this.path.slice();
    this.holder.delayedNotify();
  }

  private setSelectByObjId(objId: string | undefined) {
    const treeItem = !objId ? undefined : findItem<TreeItemExt>(item => !item.folder && item.value == objId, this.objTree);
    if (treeItem) {
      this.path = [ [ ...getPath(treeItem).map(item => item.value) ] ];
      this.folderPath = [ this.path[0].slice() ];
      this.folderPath[0].pop();
    }

    this.holder.delayedNotify();
    this.setSelect(undefined);
    if (!objId)
      return;

    this.objLoadPromise = (
      this.holder.getObject(objId)
      .then(obj => {
        if (!(obj instanceof ObjectBase))
          throw 'ObjectBase expected';
        this.setSelect(obj);
      })
      .finally(() => {
        this.objLoadPromise = undefined;
        this.holder.delayedNotify();
      })
    );
  }

  getSelectPath() {
    return this.path;
  }

  isObjLoading() {
    return this.objLoadPromise;
  }

  findObject(objId: string): Promise<ObjectBase> {
    return this.holder.getObject(objId);
  }

  setTypeMap(map: ObjTypeMap) {
    this.objTypeMap = map;
    this.updateObjTree();
  }

  /*getObjIcon(type: string) {
    const viewable = this.objTypeMap[type];
    let icon: JSX.Element;
    if (viewable && viewable.getViewDesc) {
      icon = ({...viewable.getViewDesc()}.icons || {}).item;
    }
    return icon;
  }*/

  deleteObject(args: { id: string, content: boolean }) {
    App.setSelectByPath(this.folderPath[0].join('-'));
    this.removeObj(args);
  }

  private updateObjTree = (tree?: Folder) => {
    this.tree = tree || this.tree;
    const newValues: Array<TreeItemExt> = [{
      value: 'root',
      children: [],
      deleteable: false,
      folder: true,
      open: true,
      rightIcons: (
        <>
          <CreateFolderIcon
            app={this}
            path={[]}
          />
        </>
      )
    }];
    newValues[0].children = convertFolder(this.tree, this, [], newValues[0]);

    updateValues(newValues, this.objTree);
    findItem(sortFolders, this.objTree);
    this.objTree = this.objTree.slice();
    
    this.objInfoProv = [];
    findItem((item: TreeItemExt) => {
      if (item.type)
        this.objInfoProv.push(this.getObjInfoProv(item));
    }, this.objTree);

    this.holder.delayedNotify();
  }

  private getObjInfoProv = (item: TreeItemExt) => {
    return () => ({
      name: item.title,
      id: item.value,
      type: item.type
    });
  };

  createObject() {
    createDocWizard(this.objectsToCreate)
    .then(obj => {
      this.append(obj);
    });
  }

  append(obj: ObjectBase): Promise<void> {
    const pathArr = this.folderPath[0].slice(1);

    return (
      this.holder.createObject(obj)
      .then(() => this.appendObj({ id: obj.getID(), path: pathArr }))
      .then(() => App.setSelectByObj(obj.getID()))
    );
  }

  getObjTree() {
    return this.objTree;
  }

  private selectObjectSubscriber = () => {
    this.holder.notify();
  }
  
  protected findChild(holder: ObjectBase, id: string) {
    const folders = holder.getChildren();
    for (let n = 0; n < folders.length; n++) {
      let child = folders[n].objects.find(obj => obj.getID() == id);
      if (child)
        return child;
    }
    return null;
  }

  protected setSelect(select: ObjectBase | undefined) {
    if (this.selectObj) {
      this.selectObj.unsubscribe(this.selectObjectSubscriber);
    }

    this.selectObj = select;
    
    if (select) {
      this.selectObject(select.getID());
      this.selectObj.subscribe(this.selectObjectSubscriber);
    }

    this.holder.delayedNotify();
  }

  getSelect(): ObjectBase {
    return this.selectObj;
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

  filterObjects = (filter?: Array<OBJIOItemClass>) => {
    return this.objInfoProv.filter(prov => {
      if (!filter || filter.length == 0)
        return true;

      const objClass: OBJIOItemClass = this.objTypeMap[prov().type];
      return filter.indexOf( objClass ) != -1;
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
    let fs: FileSystemSimple;

    let p: Promise<any>;
    if (!item.dstObj) {
      const doc = createFileObject(item.file.name);
      p = this.append(doc);
      fs = doc.getFS();
    } else {
      fs = item.dstObj.getFS();
      p = Promise.resolve();
    }

    this.uploading = (
      p.then(() => {
        this.holder.delayedNotify();

        const fd = fs.getFileDesc('content');
        let file = item.file;
        const fileSize = file.size;
        if (fd && fd.name == file.name && fd.fileSize == file.size && fd.uploadSize < file.size) {
          file = new File( [file.slice(fd.uploadSize)], file.name, { type: file.type });
        }

        return fs.sendFile({
          file,
          fileSize,
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
