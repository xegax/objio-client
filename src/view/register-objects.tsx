export interface ModelClass {
}

interface ModelViewPair<T> {
  model: ModelClass;
  view: (props: Object) => JSX.Element;
  wizard: () => JSX.Element;
}

export class ModelViewFactory<T = Object> {
  private models = Array<ModelViewPair<T>>();

  register(model: ModelClass, view: (props: Object) => JSX.Element, wizard: () => JSX.Element) {
    if (this.models.find(item => item.model == model))
      return;

    this.models.push({model, view, wizard});
  }

  getView(model: ModelClass, props: Object): JSX.Element {
    return (this.models.find(item => item.model == model) || { view: null }).view(props);
  }

  getWizard(objClass: ModelClass): JSX.Element {
    const item = this.models.find(item => item.model == objClass);
    if (!item.wizard)
      return null;

    return item.wizard();
  }

  create(objClass: ModelClass, args: Object): T {
    const item = this.models.find(item => item.model == objClass);
    const createDoc = (item.model as any).createDoc;
    if (createDoc)
      return createDoc(args) as T;

    return new (item.model as ObjectConstructor)(args) as T;
  }
}
