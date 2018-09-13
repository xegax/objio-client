import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { showLogin } from '../view/login';
import {
  AuthRequestor,
  createRequestor,
  OBJIOItem,
  createFactory,
  createOBJIO,
  OBJIORemoteStore,
  OBJIO
} from 'objio';
import {
  registerObjects,
  DocHolder,
  DocSpriteSheet
} from '../model/client/register-objects';
import { ViewFactory, FactoryItem } from '../common/view-factory';
import { SpriteSheetView, SpriteConfig } from '../view/sprite-sheet';

import { DocTable } from 'objio-object/client/doc-table';
import { FileObject } from 'objio-object/client/file-object';
import {
  DocLayoutView,
  DocLayout,
  DataSourceHolder
} from '../view/doc-layout';
import { DrillDownTableView, DrillDownTable } from '../view/layout/drilldown-table';

import '../../styles/styles.scss';
import { LayoutItemViewProps } from '../model/server/doc-layout';
import { CategoryFilter, CategoryFilterView } from '../view/layout/category-filter';
import { TagFilter, TagFilterView } from '../view/layout/tag-filter';
import { SelectDetailsView, SelectDetails } from '../view/layout/select-details';
import { DocView } from '../view/doc-view';
import { RangeFilterView, RangeFilter } from '../view/layout/range-filter-view';
import { DocRootView, DocRoot } from '../view/doc-root-view';
import { DocSpriteSheetArgs } from '../model/doc-sprite-sheet';
import * as Objects from 'objio-object/view';
import * as MYSQL from 'objio-mysql-database/view';
import { Database } from 'objio-sqlite-table/client/database';
import { Toaster, Position, Intent } from '@blueprintjs/core';


export const AppToaster = Toaster.create({
  position: Position.TOP,
});

let objio: OBJIO;

function initDocLayout(mvf: ViewFactory) {
  const vf = DataSourceHolder.getFactory<DocTable, DocLayout>();

  vf.register({
    classObj: FileObject,
    object: args => new DataSourceHolder(args),
    viewType: 'content',
    view: (props: LayoutItemViewProps<FileObject, FileObject>) => {
      return mvf.getView({
        classObj: FileObject,
        props: { model: props.dataSource, onlyContent: true }
      });
    }
  });

  vf.register({
    classObj: FileObject,
    object: args => new DataSourceHolder(args),
    viewType: 'objInfo',
    view: (props: LayoutItemViewProps<FileObject, FileObject>) => (
      <div>
        <div>extention: {props.dataSource.getExt()}</div>
        <div>size: {props.dataSource.getSize()}</div>
        <div>name: {props.dataSource.getName()}</div>
      </div>
    )
  });

  vf.register({
    classObj: DocTable,
    object: args => new CategoryFilter(args),
    viewType: 'category-filter',
    view: props => (
      <CategoryFilterView model = {props.model as CategoryFilter}/>
    )
  });

  vf.register({
    classObj: DocTable,
    object: args => new TagFilter(args),
    viewType: 'tag-filter',
    view: props => (
      <TagFilterView model={props.model as TagFilter}/>
    )
  });

  vf.register({
    classObj: DocTable,
    object: args => new DrillDownTable(args),
    viewType: 'drilldown-table',
    view: props => (
      <DrillDownTableView model={props.model as DrillDownTable}/>
    )
  });

  vf.register({
    classObj: DocTable,
    object: args => new SelectDetails(args),
    viewType: 'select-details',
    view: props => (
      <SelectDetailsView model={ props.model as SelectDetails }/>
    )
  });

  vf.register({
    classObj: DocTable,
    object: args => new RangeFilter(args),
    viewType: 'range-filter',
    view: props => (
      <RangeFilterView model = {props.model as RangeFilter}/>
    )
  });
}

function parseParams(args: string): {[key: string]: string} {
  const res = {};
  args.split('&').forEach(item => {
    const pair = item.split('=');
    res[pair[0]] = pair[1];
  });
  return res;
}

async function loadAndRender() {
  const p = window.location.search.split('?')[1] || '';
  const args: {prj?: string, objId?: string} = parseParams(p);

  let factory = await createFactory();
  registerObjects(factory);

  args.prj = args.prj || 'n1';
  const rootReq = createRequestor({urlBase: '/handler', params: { prj: args.prj }});
  const req = new AuthRequestor({req: rootReq, showLogin});
  const store = new OBJIORemoteStore({ req });
  /*let store = await createLocalStore(factory);
  try {
    store.load(JSON.parse(localStorage.getItem('objio')));
  } catch(e) {
    console.log('localStorage can not be loaded');
  }*/
  objio = await createOBJIO({factory, store, context: { path: `/data/projects/${args.prj}/` }});
  objio.setErrorHandler(args => {
    let message = args.error.data || args.error.toString();
    AppToaster.show({
      message: (
        <div>
          <div>{message}</div>
          <div>{JSON.stringify(args.args, null, ' ')}</div>
        </div>
      ),
      intent: Intent.DANGER
    });
  });
  /*objio.addObserver({
    onSave: () => {
      console.log('saving ' + Date.now());
      localStorage.setItem('objio', JSON.stringify(store.save()));
    }
  });*/

  let mvf = new ViewFactory();
  initDocLayout(mvf);
  
  let model: DocRoot;
  try {
    model = await objio.loadObject<DocRoot>();
  } catch (e) {
    model = new DocRoot();
    await objio.createObject(model);
    model.getHolder().save();
  }

  let obj: OBJIOItem;
  try {
    if (args.objId)
      obj = await objio.getObject(args.objId);
  } catch (e) {
  }

  objio.startWatch({req, timeOut: 100})
  .subscribe((objs: Array<OBJIOItem>) => {
    objs = objs || [];
    if (model.exists(objs))
      model.updateTree();
    model.holder.notify();
  });

  mvf.register({
    classObj: DocSpriteSheet,
    object: (args: DocSpriteSheetArgs) => new DocSpriteSheet(args),
    view: (props: {model: DocSpriteSheet}) => <SpriteSheetView key={props.model.holder.getID()} {...props} />,
    config: props => <SpriteConfig {...props}/>,
    sources: [ [ FileObject ] ],
    flags: [ 'create-wizard' ],
    description: 'Sprite sheet object'
  });

  mvf.register({
    classObj: DocLayout,
    view: (props: {model: DocLayout}) => (
      <DocLayoutView {...props}/>
    ),
    object: () => new DocLayout(),
    flags: [ 'create-wizard' ],
    description: 'Layout object'
  });

  mvf.register({
    classObj: DocHolder,
    view: (props: {model: DocHolder}) => {
      const doc = props.model.getDoc();
      return (
        <DocView {...props} root={model} vf={mvf}>
          {mvf.getView({classObj: doc.constructor, props: {model: doc}})}
        </DocView>
      );
    },
    object: () => new DocHolder()
  });

  mvf.register({
    classObj: DocRoot,
    view: (props: {model: DocRoot}) => (
      <DocRootView
        vf={mvf}
        getView={(obj: DocHolder | FileObject) => {
          let view = React.cloneElement(
            mvf.getView({classObj: obj.constructor, props: { model: obj }}),
            { key: obj.holder.getID() }
          );

          if (obj instanceof DocHolder)
            return view;

          return (
            <DocView
              model={obj}
              root={model}
              vf={mvf}
              key={obj.holder.getID()}
            >
              {view}
            </DocView>
          );
        }}
        {...props}
      />
    ),
    object: () => new DocRoot()
  });

  mvf.register({
    classObj: Database,
    view: (props: {model: Database}) => <div>SQLITE3 Database {props.model.holder.getID()}</div>,
    object: () => new Database(),
    flags: ['create-wizard'],
    description: 'SQLITE3 Database'
  });

  [
    ...Objects.getViews(),
    ...MYSQL.getViews()
  ].forEach(classObj => {
    if (!classObj.getViewDesc)
      return;

    const viewDesc = classObj.getViewDesc();
    (viewDesc.views || []).forEach(viewItem => {
      const factItem: FactoryItem = {
        classObj,
        view: viewItem.view,
        object: args => classObj.create(args)
      };

      if (viewDesc.config)
        factItem.config = props => viewDesc.config(props);

      if (viewItem.viewType)
        factItem.viewType = viewItem.viewType;

      if (viewDesc.sources)
        factItem.sources = viewDesc.sources;

      factItem.flags = viewDesc.flags as Set<string>;
      factItem.description = viewDesc.desc;
      mvf.register(factItem);
    });
  });

  let cont = document.createElement('div');
  cont.style.position = 'absolute';
  cont.style.left = '0px';
  cont.style.top = '0px';
  cont.style.bottom = '0px';
  cont.style.right = '0px';
  cont.style.display = 'flex';
  document.body.appendChild(cont);
  document.body.style.overflow = 'hidden';

  if (obj) {
    ReactDOM.render(
      mvf.getView({ classObj: obj.constructor, props: {model: obj}}),
      cont
    );
  } else {
    ReactDOM.render(
      mvf.getView({ classObj: model.constructor, props: {model}}),
      cont
    );
  }
}

loadAndRender();
