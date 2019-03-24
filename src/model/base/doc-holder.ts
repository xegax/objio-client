import { SERIALIZER, OBJIOItem } from 'objio';
import { ObjectBase, SendFileArgs } from 'objio-object/base/object-base';

export interface DocHolderArgs {
  doc: ObjectBase;
}

export class DocHolderBase extends ObjectBase {
  protected doc: ObjectBase;
  protected name: string;
  protected loadTask: Promise<ObjectBase>;
  protected childNum: number = 0;
  protected objType: string = '';
  protected subscribers = Array<(() => void)>();

  constructor(args?: DocHolderArgs) {
    super();

    if (args) {
      this.doc = args.doc;
      this.name = this.doc.getName();
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

    return this.doc.getObjType();
  }

  isLoaded(): boolean {
    return this.doc instanceof ObjectBase;
  }

  isLoadInProgress(): boolean {
    return this.loadTask != null;
  }

  getProgress() {
    if (!this.get())
      return 0;

    return this.doc.getProgress();
  }

  getChildNum() {
    return this.childNum;
  }

  getChildren() {
    if (!this.get())
      return [];

    return this.doc.getChildren();
  }

  isStatusInProgess() {
    if (!this.get())
      return false;

    return this.doc.isStatusInProgess();
  }

  private onObjLoaded = (obj: ObjectBase) => {
    this.loadTask = null;
    this.doc = obj;
    obj.holder.subscribe(this.notifySubscibers);

    this.doc.holder.addEventHandler({
      onObjChange: () => {
        const folders = this.getChildren();
        if (!folders || !folders.length)
          return;

        this.childNum = folders[0].objects.length;
        this.objType = OBJIOItem.getClass(this.doc).TYPE_ID;
        this.holder.save();
        this.holder.delayedNotify();
      }
    });
    return this.doc;
  }

  load(): Promise<ObjectBase> {
    if (this.isLoaded())
      return Promise.resolve(this.doc);

    if (!this.loadTask) (
      this.loadTask = this.holder.getObject<ObjectBase>(this.doc as any)
      .then(this.onObjLoaded)
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

    return this.doc;
  }

  getID(): string {
    if (!this.isLoaded())
      return this.doc as any;

    return this.doc.holder.getID();
  }

  getName(): string {
    if (!this.isLoaded())
      return this.name || '';

    return this.doc.getName();
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

    return this.doc.getAppComponents();    
  }

  getObjPropGroups() {
    if (!this.get())
      return super.getObjPropGroups();

    return this.doc.getObjPropGroups();
  }

  sendFile(args: SendFileArgs): Promise<any> {
    if (!this.get())
      return Promise.reject('object not loaded yet');

    return this.doc.sendFile(args);
  }

  static TYPE_ID = 'DocHolder';
  static SERIALIZE: SERIALIZER = () => ({
    doc:  { type: 'object-deferred' },
    name: { type: 'string' },
    childNum: { type: 'integer' },
    objType: { type: 'string' }
  });
}
