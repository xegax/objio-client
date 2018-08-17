import { LayoutCont } from 'ts-react-ui/model/layout';
import { OBJIOItem, OBJIOArray, SERIALIZER } from 'objio';

export interface DataSourceHolderArgs<
  TSource extends OBJIOItem = OBJIOItem,
  TLayout extends DocLayout = DocLayout> {
    source: TSource;
    layout: TLayout;
    viewType?: string;
}

export interface LayoutItemViewProps
<TSource extends OBJIOItem = OBJIOItem, TModel extends OBJIOItem = OBJIOItem> {
  dataSource: TSource;
  model: TModel;
}

export interface FactoryItem {
  classObj: Object;
  viewType?: string;
  view(props: LayoutItemViewProps): JSX.Element;
  object?(args: DataSourceHolderArgs): DataSourceHolder;
}

export class ViewFactory {
  private items = Array<FactoryItem>();

  register(args: FactoryItem): void {
    if (this.items.find(item => args.classObj == item.classObj && args.viewType == item.viewType))
      throw 'this already registered';

    args = {...args};
    if (!args.object)
      args.object = (args: DataSourceHolderArgs) => {
        return new DataSourceHolder(args);
      };

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

export class DataSourceHolder<
  TSource extends OBJIOItem = OBJIOItem,
  TLayout extends DocLayout = DocLayout> extends OBJIOItem {

  protected source: TSource;
  protected layout: TLayout;
  protected viewType: string;
  protected edit: boolean = false;

  toggleEdit(): void {
    this.edit = !this.edit;
    this.holder.delayedNotify();
  }

  isEdit(): boolean {
    return this.edit;
  }

  constructor(args: DataSourceHolderArgs<TSource, TLayout>) {
    super();
    if (!args)
      return;

    this.source = args.source;
    this.viewType = args.viewType;
    this.layout = args.layout;
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

  get(): TSource {
    return this.source as TSource;
  }

  getViewType(): string {
    return this.viewType;
  }

  getAllSources(): Array<TSource> {
    let srcs = Array<TSource>();
    this.layout.getObjects().getArray().forEach(holder => {
      const source = holder.get() as TSource;
      if (srcs.indexOf(source) == -1)
        srcs.push(source);
    });
    return srcs;
  }

  static TYPE_ID = 'DataSourceHolder';
  static SERIALIZE: SERIALIZER = () => ({
    source:   { type: 'object' },
    viewType: { type: 'string' },
    layout:   { type: 'object' }
  });
}

export class DocLayout extends OBJIOItem {
  protected layout: LayoutCont = {type: 'row', items: []};
  protected objects = new OBJIOArray<DataSourceHolder>();

  getObjects(): OBJIOArray<DataSourceHolder> {
    return this.objects;
  }

  static TYPE_ID = 'DocLayout';
  static SERIALIZE: SERIALIZER = () => ({
    layout: { type: 'json' },
    objects: { type: 'object' }
  });
}
