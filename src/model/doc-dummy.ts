import { SERIALIZER, OBJIOItem } from 'objio';
import { DocHolder } from './doc-holder';

export class DocDummy extends OBJIOItem {
  private text: string = 'dummy doc created ' + new Date();

  getText(): string {
    return this.text;
  }

  static TYPE_ID = 'DocDummy';
  static SERIALIZE: SERIALIZER = () => ({
    text: {type: 'string'}
  });
}
