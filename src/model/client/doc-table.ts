import { TableHolder } from 'objio-object/table-holder';
import { SERIALIZER } from 'objio';
import { RenderListModel } from 'ts-react-ui/list';

export class DocTable extends TableHolder {
  private render = new RenderListModel(0, 20);

  constructor() {
    super();

    this.render.setHandler({
      loadItems: (from, count) => {
        return this.loadCells({first: from, count});
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
