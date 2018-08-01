import { OBJIOItem, SERIALIZER } from 'objio';
import { Table } from 'objio-object/table';

export class DocTable extends OBJIOItem {
  protected table = new Table();

  static TYPE_ID = 'DocTable';
  static SERIALIZE: SERIALIZER = () => ({
    table: { type: 'object' }
  });
}
