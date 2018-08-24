import { OBJIOArray, OBJIOItem, SERIALIZER } from 'objio';
import { FileObject } from 'objio-object/file-object';
import { DocHolder } from './doc-holder';

export class DocRoot extends OBJIOItem {
  protected files = new OBJIOArray<FileObject>();
  protected docs = new OBJIOArray<DocHolder>();

  static TYPE_ID = 'DocRoot';
  static SERIALIZE: SERIALIZER = () => ({
    files:  { type: 'object' },
    docs:   { type: 'object' }
  });
}
