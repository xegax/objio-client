import { LayoutCont } from 'ts-react-ui/model/layout';
import { OBJIOItem, OBJIOArray, SERIALIZER } from 'objio';
import { ViewFactory, FactoryItem } from '../../common/view-factory';

export { ViewFactory, FactoryItem };

export interface DataSourceHolderArgs<
  TSource extends OBJIOItem = OBJIOItem,
  TLayout extends DocLayout = DocLayout> {
    source: TSource;
    layout: TLayout;
    viewType?: string;
}

export interface LayoutItemViewProps
<TModel extends OBJIOItem = OBJIOItem, TSource extends OBJIOItem = OBJIOItem> {
  dataSource: TSource;
  model: TModel;
}

export class DataSourceHolder<
  TSource extends OBJIOItem = OBJIOItem,
  TLayout extends DocLayout = DocLayout> extends OBJIOItem {

  protected name: string;
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

  static getFactory<TSource extends OBJIOItem, TLayout extends DocLayout>() {
    return DataSourceHolder.viewFactory as ViewFactory<
      LayoutItemViewProps<OBJIOItem>,
      DataSourceHolderArgs<TSource, TLayout>,
      DataSourceHolder<TSource, TLayout>
    >;
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

  getName(): string {
    return this.name;
  }

  setName(name: string): void {
    if (name == this.name)
      return;
    
    this.name = name;
    this.holder.save();
    this.holder.delayedNotify();
  }

  static TYPE_ID = 'DataSourceHolder';
  static SERIALIZE: SERIALIZER = () => ({
    source:   { type: 'object' },
    viewType: { type: 'string' },
    layout:   { type: 'object' },
    name:     { type: 'string' }
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
    layout:   { type: 'json' },
    objects:  { type: 'object' }
  });
}
