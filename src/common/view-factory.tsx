import { OBJIOItem, OBJIOItemClass } from 'objio';
import { Props } from 'objio-object/view/config';

export interface FactoryItem< TProps = {}, TArgs = {}, TObject = OBJIOItem> {
  classObj: OBJIOItemClass;
  viewType?: string;
  view(props: TProps): JSX.Element;
  object(args: TArgs): TObject;
  config?(props: Props): JSX.Element;
  sources?:  Array<Array<OBJIOItemClass>>;
  flags?: Set<string> | Array<string>;
  description?: string;
}

export class ViewFactory< TProps extends Object = {},
                          TArgs extends Object = {},
                          TObject extends OBJIOItem = OBJIOItem > {
  private items = Array<FactoryItem<TProps, TArgs, TObject>>();

  register(args: FactoryItem<TProps, TArgs, TObject>): void {
    if (this.items.find(item => args.classObj == item.classObj && args.viewType == item.viewType))
      throw 'this already registered';

    args = {
      description: args.classObj.TYPE_ID,
      ...args
    };
    if (Array.isArray(args.flags || []))
      args.flags = new Set(args.flags || []);

    this.items.push(args);
  }

  find(args: {classObj: Object, viewType?: string}): Array<FactoryItem<TProps, TArgs, TObject>> {
    if (!args.viewType)
      return this.items.filter(item => item.classObj == args.classObj);

    return this.items.filter(item => (
      item.classObj == args.classObj && item.viewType == args.viewType
    ));
  }

  findBySource(srcClass: Array<OBJIOItemClass>): Array<FactoryItem> {
    return [];
    /*return this.items.filter(item => {
      return item.sources && item.sources.indexOf(srcClass) != -1;
    });*/
  }

  getView(args: {classObj: Object, viewType?: string, props: TProps}): JSX.Element {
    const item = this.items.find(item => item.classObj == args.classObj && item.viewType == args.viewType);
    if (!item)
      return null;

    return item.view(args.props);
  }

  getItems() {
    return this.items;
  }
}
