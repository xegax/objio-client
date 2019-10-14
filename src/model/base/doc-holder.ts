import { SERIALIZER, OBJIOItem } from 'objio';
import { ObjectBase, SendFileArgs, ObjProps } from 'objio-object/base/object-base';
import { FileObjectBase } from 'objio-object/base/file-object';

export interface DocHolderArgs {
  doc: ObjectBase;
}

export class DocHolderBase extends ObjectBase {
  protected doc: string;
  protected docRef: ObjectBase;
  protected name: string;
  protected loadTask: Promise<ObjectBase>;
  protected childNum: number = 0;
  protected objType: string = '';
  protected subscribers = Array<(() => void)>();

  constructor(args?: DocHolderArgs) {
    super();

    if (args) {
      this.docRef = args.doc;
      this.doc = args.doc as any;
      this.onObjLoadedOrCreated(this.docRef);
      this.name = this.docRef.getName();
      this.objType = OBJIOItem.getClass(args.doc).TYPE_ID;
    }

    this.holder.subscribe(this.notifySubscibers);
  }

  private notifySubscibers = () => {
    this.subscribers.forEach(s => s());
  }

  subscribe(cb: () => void) {
    if (this.subscribers.indexOf(cb) == -1)
      this.subscribers.push(cb);
  }

  unsubscribe(cb: () => void) {
    this.subscribers.splice(this.subscribers.indexOf(cb), 1);
  }

  getObjType(): string {
    if (!this.get())
      return this.objType;

    return this.docRef.getObjType();
  }

  isLoaded(): boolean {
    return this.docRef instanceof ObjectBase;
  }

  isLoadInProgress(): boolean {
    return this.loadTask != null;
  }

  getProgress() {
    if (!this.get())
      return 0;

    return this.docRef.getProgress();
  }

  getChildNum() {
    return this.childNum;
  }

  getChildren() {
    if (!this.get())
      return [];

    return this.docRef.getChildren();
  }

  isStatusInProgess() {
    if (!this.get())
      return false;

    return this.docRef.isStatusInProgess();
  }

  private onObjLoadedOrCreated = (obj: ObjectBase): ObjectBase => {
    this.loadTask = null;
    this.docRef = obj;
    obj.holder.subscribe(this.notifySubscibers);

    this.docRef.holder.addEventHandler({
      onObjChange: () => {
        const folders = this.getChildren();
        if (!folders || !folders.length)
          return;

        this.childNum = folders[0].objects.length;
        this.objType = OBJIOItem.getClass(this.docRef).TYPE_ID;
        this.holder.save();
        this.holder.delayedNotify();
      }
    });
    return obj;
  }

  load(): Promise<ObjectBase> {
    if (this.isLoaded())
      return Promise.resolve(this.docRef);

    if (!this.loadTask) (
      this.loadTask = this.holder.getObject<ObjectBase>(this.doc)
      .then(this.onObjLoadedOrCreated)
      .catch(() => {
        this.loadTask = null;
        return null;
      })
    );

    return this.loadTask;
  }

  get(): ObjectBase {
    if (!this.isLoaded())
      return null;

    return this.docRef;
  }

  getID(): string {
    if (!this.isLoaded())
      return this.doc;

    return this.docRef.holder.getID();
  }

  getVersion() {
    if (!this.isLoaded())
      return this.holder.getVersion();

    return this.docRef.holder.getVersion();
  }

  getName(): string {
    if (!this.isLoaded())
      return this.name || '';

    return this.docRef.getName();
  }

  setName(name: string) {
    if (this.name == name)
      return;

    this.name = name;
    const doc = this.get();
    if (doc)
      doc.setName(name);

    this.holder.save();
    this.holder.notify();
  }

  getAppComponents() {
    if (!this.get())
      return super.getAppComponents();

    return this.docRef.getAppComponents();    
  }

  getObjPropGroups(props: ObjProps) {
    if (!this.get())
      return super.getObjPropGroups(props);

    return this.docRef.getObjPropGroups(props);
  }

  getObjTabs() {
    if (!this.get())
      return super.getObjTabs();

    return this.docRef.getObjTabs();
  }

  getFileDropDest() {
    if (!this.get())
      return Promise.reject('object not loaded yet');

    return this.docRef.getFileDropDest();
  }

  sendFile(args: SendFileArgs): Promise<any> {
    if (!this.get())
      return Promise.reject('object not loaded yet');

    return this.docRef.sendFile(args);
  }

  removeContent() {
    if (!this.get())
      return Promise.reject('object not loaded yet');

    if (this.docRef instanceof FileObjectBase)
      this.docRef.removeContent();

    return Promise.resolve();
  }

  static TYPE_ID = 'DocHolder';
  static SERIALIZE: SERIALIZER = () => ({
    doc:  { type: 'object-deferred' },
    name: { type: 'string' },
    childNum: { type: 'integer' },
    objType: { type: 'string' }
  });
}
