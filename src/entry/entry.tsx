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
  OBJIO,
  OBJIOItemClass
} from 'objio';
import {
  registerObjects,
  DocHolder,
  DocSpriteSheet
} from '../model/client/register-objects';
import { ViewFactory } from '../common/view-factory';
import { SpriteSheetView } from '../view/sprite-sheet';

import { DocTable, DocTableView } from '../view/doc-table-view';
import { FileObject, FileArgs } from 'objio-object/file-object';
import { FileObjectView } from '../view/file-object-view';
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
import { CSVFileObject } from 'objio-object/csv-file-object';
import { CSVFileView } from '../view/csv-file-view';
import { VideoFileView } from '../view/video-file-view';
import { DocRootView, DocRoot } from '../view/doc-root-view';
import { VideoFileObject } from 'objio-object/video-file-object';
import { DocSpriteSheetArgs } from '../model/doc-sprite-sheet';

let objio: OBJIO;

function initDocLayout(prj: string) {
  const vf = DataSourceHolder.getFactory<DocTable, DocLayout>();

  vf.register({
    classObj: FileObject,
    object: args => new DataSourceHolder(args),
    viewType: 'content',
    view: props => (
      <FileObjectView
        model={props.dataSource as FileObject}
        prj={prj}
        createDoc={null}
        onlyContent
      />
    )
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
  objio = await createOBJIO({factory, store});
  /*objio.addObserver({
    onSave: () => {
      console.log('saving ' + Date.now());
      localStorage.setItem('objio', JSON.stringify(store.save()));
    }
  });*/

  initDocLayout(args.prj);

  let model: DocRoot;
  try {
    model = await objio.loadObject<DocRoot>();
  } catch (e) {
    model = new DocRoot();
    await objio.createObject<DocRoot>(model);
    model.getHolder().save();
  }

  let obj: OBJIOItem;
  try {
    if (args.objId)
      obj = await objio.getObject(args.objId);
  } catch (e) {
  }

  objio.startWatch({req, timeOut: 100}).subscribe((objs: Array<OBJIOItem>) => {
    objs = objs || [];
    if (model.exists(objs))
      model.updateTree();
    model.holder.notify();
  });

  //let mvf = new ModelViewFactory<OBJIOItem>();
  let mvf = new ViewFactory();
  mvf.register({
    classObj: DocSpriteSheet,
    object: (args: DocSpriteSheetArgs) => new DocSpriteSheet(args),
    view: (props: {model: DocSpriteSheet}) => <SpriteSheetView key={props.model.holder.getID()} {...props} />,
    // () => <SpriteWizard list={['default.png', 'prehistoric.png', 'SNES_MK1_reptile.png']}/>
  });

  mvf.register({
    classObj: DocTable,
    object: () => new DocTable(),
    view: (props: {model: DocTable}) => <DocTableView key={props.model.holder.getID()} {...props}/>
  });

  mvf.register({
    classObj: FileObject,
    object: (args: FileArgs) => new FileObject(args),
    view: (props: {model: FileObject}) => (
      <FileObjectView
        key={props.model.holder.getID()}
        createDoc={newObj => {
          return model.append(new DocHolder({doc: newObj})).then(() => newObj);
        }}
        prj={args.prj}
        {...props}
      />
    )
  });

  mvf.register({
    classObj: CSVFileObject,
    view: (props: {model: CSVFileObject}) => (
      <CSVFileView
        key={props.model.holder.getID()}
        createDoc={newObj => {
          return model.append(new DocHolder({doc: newObj})).then(() => newObj);
        }}
        prj={args.prj}
        {...props}
      />
    ),
    object: (args: FileArgs) => new CSVFileObject(args)
  });

  mvf.register({
    classObj: VideoFileObject as OBJIOItemClass,
    view: (props: {model: VideoFileObject}) => (
      <VideoFileView
        key={props.model.holder.getID()}
        createDoc={newObj => {
          return model.append(new DocHolder({doc: newObj})).then(() => newObj);
        }}
        prj={args.prj}
        {...props}
      />
    ),
    object: (args: FileArgs) => new VideoFileObject(args)
  });

  mvf.register({
    classObj: DocLayout,
    view: (props: {model: DocLayout}) => (
      <DocLayoutView {...props}/>
    ),
    object: () => new DocLayout()
  });

  mvf.register({
    classObj: DocHolder,
    view: (props: {model: DocHolder}) => {
      const doc = props.model.getDoc();
      return (
        <DocView {...props}>
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
        getView={(obj: DocHolder | FileObject) => (
          <DocView
            model={obj}
            onRemove={() => {
              model.remove(obj);
            }}>
            {
              obj instanceof DocHolder ? (
                mvf.getView({classObj: obj.getDoc().constructor, props: {model: obj.getDoc()}})
              ) : (
                mvf.getView({classObj: obj.constructor, props: { model: obj }})
              )
            }
          </DocView>
        )}
        {...props}
      />
    ),
    object: () => new DocRoot()
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
