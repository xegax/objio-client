import { LayoutCont } from 'ts-react-ui/model/layout';
import { OBJIOItem, OBJIOArray, SERIALIZER } from 'objio';

export interface LayoutItemViewProps
<TSource extends OBJIOItem = OBJIOItem, TModel extends OBJIOItem = OBJIOItem> {
  dataSource: TSource;
  model: TModel;
}

export interface FactoryItem {
  classObj: Object;
  viewType?: string;
  view(props: LayoutItemViewProps): JSX.Element;
  object?(source: OBJIOItem): DataSourceHolder;
}

export class ViewFactory {
  private items = Array<FactoryItem>();

  register(args: FactoryItem): void {
    if (this.items.find(item => args.classObj == item.classObj && args.viewType == item.viewType))
      throw 'this already registered';

    args = {...args};
    if (!args.object)
      args.object = (source: OBJIOItem) => new DataSourceHolder({source, viewType: args.viewType});

    this.items.push(args);
  }

  find(args: {classObj: Object, viewType?: string}): Array<FactoryItem> {
    if ('viewType' in args)
      return this.items.filter(item => {
        item.classObj == args.classObj && item.viewType == args.viewType
      });
    return this.items.filter(item => item.classObj == args.classObj);
  }

  getView(args: {classObj: Object, viewType: string, props: LayoutItemViewProps}): JSX.Element {
    const item = this.items.find(item => item.classObj == args.classObj && item.viewType == args.viewType);
    if (!item)
      return null;

    return item.view(args.props);
  }
}

export class DataSourceHolder<T extends OBJIOItem = OBJIOItem> extends OBJIOItem {
  protected source: T;
  protected viewType: string;

  constructor(args: {source: T, viewType?: string}) {
    super();
    if (!args)
      return;

    this.source = args.source;
    this.viewType = args.viewType;
  }

  private static viewFactory = new ViewFactory();

  static setFactory(vf: ViewFactory): void {
    DataSourceHolder.viewFactory = vf;
  }
  
  static findAllViews(classObj: Object): Array<FactoryItem> {
    return DataSourceHolder.viewFactory.find({ classObj });
  }

  getView(): JSX.Element {
    return DataSourceHolder.viewFactory.getView({
      classObj: OBJIOItem.getClass(this.source),
      props: { dataSource: this.source, model: this },
      viewType: this.viewType
    });
  }

  get(): T {
    return this.source as T;
  }

  getViewType(): string {
    return this.viewType;
  }

  static TYPE_ID = 'DataSourceHolder';
  static SERIALIZE: SERIALIZER = () => ({
    source:   { type: 'object' },
    viewType: { type: 'string' }
  });
}

export class DocLayout extends OBJIOItem {
  protected layout: LayoutCont = {type: 'row', items: []};
  protected objects = new OBJIOArray<DataSourceHolder>();

  static TYPE_ID = 'DocLayout';
  static SERIALIZE: SERIALIZER = () => ({
    layout: { type: 'json' },
    objects: { type: 'object' }
  });
}