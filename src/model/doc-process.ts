import { SERIALIZER, OBJIOItem } from 'objio';

export class DocProcess extends OBJIOItem {
  protected progress: number = 0;

  getProgress(): number {
    return this.progress;
  }

  run() {
    this.holder.invokeMethod('run', {});
  }

  static TYPE_ID = 'DocProcess';
  static SERIALIZE: SERIALIZER = () => ({
    progress: {type: 'number'}
  });
}
