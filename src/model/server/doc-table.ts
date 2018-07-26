import { TableHolder } from 'objio-object/server/table-holder';
import { SERIALIZER } from 'objio';

export class DocTable extends TableHolder {
  static TYPE_ID = 'DocTable';
  static SERIALIZE: SERIALIZER = () => ({
    ...TableHolder.SERIALIZE()
  });
}
