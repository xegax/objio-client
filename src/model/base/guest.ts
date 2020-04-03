import { Publisher, OBJIOItem, OBJIO } from 'objio';
import { ViewFactory } from 'objio-object/common/view-factory';
import { HashState } from 'ts-react-ui/hash-state';

interface HashParams {
  objId?: string;
}

export class GuestModel extends Publisher {
  private vf: ViewFactory;
  private objio: OBJIO;
  private obj?: OBJIOItem;
  private hashState = new HashState<HashParams>();

  constructor(args: { vf: ViewFactory, objio: OBJIO }) {
    super();

    this.vf = args.vf;
    this.objio = args.objio;
    this.hashState.subscribe(this.onHashChanged);
    this.onHashChanged();
  }

  private onHashChanged = async () => {
    this.obj = undefined;
    try {
      let objId = this.hashState.getString('objId');
      if (objId)
        this.obj = await this.objio.loadObject(objId);
    } catch (e) {
    }

    this.delayedNotify();
  }

  render(): React.ReactNode {
    if (!this.obj)
      return null;

    return this.vf.getView({
      classObj: this.obj.constructor,
      props: { model: this.obj }
    });
  }
}
