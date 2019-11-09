import { SERIALIZER, OBJIOItem } from 'objio';
import { ObjectBase } from 'objio-object/base/object-base';

export interface DocHolderArgs {
  doc: ObjectBase;
}

export class DocHolder extends OBJIOItem {
  protected doc: string;
  protected name: string;
  protected type: string;
  protected ref: ObjectBase;

  constructor(args?: DocHolderArgs) {
    super();

    if (args) {
      this.ref = args.doc;
      this.ref.holder.addEventHandler({ onObjChange: this.subscriber });
      this.doc = args.doc as any;
      this.name = args.doc.getName();
      this.type = args.doc.getObjType();
    }
  }

  getID() {
    const obj = this.get();
    if (obj)
      return obj.holder.getID();

    return this.doc;
  }

  getName() {
    return this.name;
  }

  getObjType() {
    return this.type;
  }

  isLoaded() {
    return this.get() != undefined;
  }

  private subscriber = () => {
    const name = this.get().getName();
    if (this.name == name)
      return;

    this.name = name;
    this.holder.onObjChanged();
    this.holder.save();
  };

  load() {
    const obj = this.get();
    if (obj)
      return Promise.resolve(obj);

    return (
      this.holder.getObject<ObjectBase>(this.doc)
      .then(obj => {
        this.ref = obj;
        obj.holder.addEventHandler({ onObjChange: this.subscriber });
        return obj;
      })
    );
  }

  get(): ObjectBase | undefined {
    if (!this.ref)
      return undefined;

    return this.ref;
  }

  static TYPE_ID = 'DocHolder';
  static SERIALIZE: SERIALIZER = () => ({
    doc:  { type: 'object-deferred' },
    name: { type: 'string' },
    type: { type: 'string', const: true }
  });
}
