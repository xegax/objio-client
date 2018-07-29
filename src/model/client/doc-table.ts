import { TableHolder } from 'objio-object/table-holder';
import { SERIALIZER } from 'objio';
import { RenderListModel } from 'ts-react-ui/list';
import { timer, cancelable, Cancelable } from 'objio/common/promise';

export class DocTable extends TableHolder {
  private render = new RenderListModel(0, 20);
  private lastLoadTimer: Cancelable;
  private maxTimeBetweenRequests: number = 300;

  constructor() {
    super();

    this.render.setHandler({
      loadItems: (from, count) => {
        if (this.lastLoadTimer) {
          this.lastLoadTimer.cancel();
          this.lastLoadTimer = null;
        }

        this.lastLoadTimer = cancelable(timer(this.maxTimeBetweenRequests));
        return this.lastLoadTimer.then(() => {
          this.lastLoadTimer = null;
          return this.loadCells({ first: from, count });
        });
      }}
    );
  }

  getRender(): RenderListModel {
    return this.render;
  }

  static TYPE_ID = 'DocTable';
  static SERIALIZE: SERIALIZER = () => ({
    ...TableHolder.SERIALIZE()
  });
}
