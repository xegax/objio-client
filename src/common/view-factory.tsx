import { OBJIOItem } from 'objio';

export interface FactoryItem< TProps = {}, TArgs = {}, TObject = OBJIOItem> {
  classObj: Object;
  viewType?: string;
  view(props: TProps): JSX.Element;
  object(args: TArgs): TObject;
}

export class ViewFactory< TProps extends Object = {},
                          TArgs extends Object = {},
                          TObject extends OBJIOItem = OBJIOItem > {
  private items = Array<FactoryItem<TProps, TArgs, TObject>>();

  register(args: FactoryItem<TProps, TArgs, TObject>): void {
    if (this.items.find(item => args.classObj == item.classObj && args.viewType == item.viewType))
      throw 'this already registered';

    args = {...args};
    this.items.push(args);
  }

  find(args: {classObj: Object, viewType?: string}): Array<FactoryItem<TProps, TArgs, TObject>> {
    if (!args.viewType)
      return this.items.filter(item => item.classObj == args.classObj);

    return this.items.filter(item => (
      item.classObj == args.classObj && item.viewType == args.viewType
    ));
  }

  getView(args: {classObj: Object, viewType?: string, props: TProps}): JSX.Element {
    const item = this.items.find(item => item.classObj == args.classObj && item.viewType == args.viewType);
    if (!item)
      return null;

    return item.view(args.props);
  }
}
