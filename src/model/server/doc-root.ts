import { DocRootBase } from '../base/doc-root';
import { DocHolderBase } from '../base/doc-holder';
import { DocHolder } from '../client/doc-holder';
import { FileObject } from 'objio-object/server/file-object';

export class DocRoot extends DocRootBase {
  constructor() {
    super();

    this.holder.setMethodsToInvoke({
      appendObj: {
        method: (args: { id: string }) => this.appendObj(args.id),
        rights: 'write'
      },
      removeObj: {
        method: (args: { id: string, content: boolean }) => this.removeObj(args),
        rights: 'write'
      }
    });
  }

  appendObj(id: string) {
    let holder: DocHolder;
    return (
      this.holder.getObject<DocHolderBase>(id)
      .then(doc => {
        return this.holder.createObject(holder = new DocHolder({ doc }));
      })
      .then(() => {
        this.objects.push(holder);
        this.objects.holder.save();
        this.holder.save(true);
      })
    );
  }

  removeObj(args: { id: string; content: boolean }) {
    const i = this.objects.find(holder => {
      return holder.getID() == args.id || holder.holder.getID() == args.id;
    });
    if (i == -1)
      throw `object id=${args.id} not found`;

    let p = Promise.resolve();
    if (args.content) {
      let obj = this.objects.get(i);
      if (obj instanceof DocHolderBase) {
        if (obj.isLoaded())
          FileObject.removeContent(obj.get() as FileObject);
        else
          p = obj.load().then(obj => FileObject.removeContent(obj as FileObject));
      } else {
        FileObject.removeContent(obj as FileObject);
      }
    }

    return (
      p.then(() => {
        this.objects.remove(i);
        this.objects.holder.save();
        this.holder.save(true);
      })
    );
  }
}
