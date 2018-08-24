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
  DocSpriteSheet,
  DocTable
} from '../model/client/register-objects';
import { ModelViewFactory } from '../view/register-objects';
import { SpriteSheetView, SpriteWizard } from '../view/sprite-sheet';

import { DocTableView, DocTableWizard } from '../view/doc-table-view';
import { FileObject } from 'objio-object/file-object';
import { FileObjectView } from '../view/file-object-view';
import {
  DocLayoutView,
  DocLayout,
  DataSourceHolder,
  ViewFactory
} from '../view/doc-layout';
import { DrillDownTableView, DrillDownTable } from '../view/layout/drilldown-table';

import '../../styles/styles.scss';
import { DataSourceHolderArgs, LayoutItemViewProps } from '../model/server/doc-layout';
import { CategoryFilter, CategoryFilterView } from '../view/layout/category-filter';
import { TagFilter, TagFilterView } from '../view/layout/tag-filter';
import { SelectDetailsView, SelectDetails } from '../view/layout/select-details';
import { DocView } from '../view/doc-view';
import { RangeFilterView, RangeFilter } from '../view/layout/range-filter-view';
import { CSVFileObject } from 'objio-object/csv-file-object';
import { CSVFileView } from '../view/csv-file-view';
import { DocVideo } from '../model/client/doc-video';
import { VideoFileView } from '../view/video-file-view';
import { DocRootView, DocRoot } from '../view/doc-root-view';
import { VideoFileObject } from 'objio-object/video-file-object';

let objio: OBJIO;

function initDocLayout(prj: string) {
  const vf = new ViewFactory();
  vf.register({
    classObj: FileObject,
    view: (props: LayoutItemViewProps<FileObject>) => (
      <FileObjectView
        model={props.dataSource}
        prj={prj}
        createDoc={null}
        onlyContent
      />
    ),
    viewType: 'content'
  });
  vf.register({
    classObj: FileObject,
    view: (props: LayoutItemViewProps<FileObject>) => (
      <div>
        <div>extention: {props.dataSource.getExt()}</div>
        <div>size: {props.dataSource.getSize()}</div>
        <div>name: {props.dataSource.getName()}</div>
      </div>
    ),
    viewType: 'objInfo'
  });
  vf.register({
    classObj: DocTable,
    view: (props: LayoutItemViewProps<DocTable, CategoryFilter>) => (
      <CategoryFilterView {...props}/>
    ),
    object: (args: DataSourceHolderArgs<DocTable, DocLayout>) => {
      return new CategoryFilter(args);
    },
    viewType: 'category-filter'
  });

  vf.register({
    classObj: DocTable,
    view: (props: LayoutItemViewProps<DocTable, TagFilter>) => (
      <TagFilterView {...props}/>
    ),
    object: (args: DataSourceHolderArgs<DocTable, DocLayout>) => {
      return new TagFilter(args);
    },
    viewType: 'tag-filter'
  });

  vf.register({
    classObj: DocTable,
    view: (props: LayoutItemViewProps<DocTable, DrillDownTable>) => (
      <DrillDownTableView {...props}/>
    ),
    object: (args: DataSourceHolderArgs<DocTable, DocLayout>) => {
      return new DrillDownTable(args);
    },
    viewType: 'drilldown-table'
  });

  vf.register({
    classObj: DocTable,
    view: (props: LayoutItemViewProps<DocTable, SelectDetails>) => (
      <SelectDetailsView {...props}/>
    ),
    object: (args: DataSourceHolderArgs<DocTable, DocLayout>) => {
      return new SelectDetails(args);
    },
    viewType: 'select-details'
  });

  vf.register({
    classObj: DocTable,
    view: (props: LayoutItemViewProps<DocTable, RangeFilter>) => (
      <RangeFilterView {...props}/>
    ),
    object: (args: DataSourceHolderArgs<DocTable, DocLayout>) => {
      return new RangeFilter(args);
    },
    viewType: 'range-filter'
  });
  DataSourceHolder.setFactory(vf);
}

async function loadAndRender() {
  const p = window.location.search.split('?')[1] || '';
  const args: {prj?: string} = {};
  p.split('&').forEach(item => {
    const pair = item.split('=');
    args[pair[0]] = pair[1];
  });

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

  objio.startWatch({req, timeOut: 100}).subscribe((objs: Array<OBJIOItem>) => {
    objs = objs || [];
    if (model.exists(objs))
      model.updateTree();
    model.holder.notify();
  });

  let mvf = new ModelViewFactory<OBJIOItem>();
  mvf.register(
    DocSpriteSheet,
    (props: {model: DocSpriteSheet}) => <SpriteSheetView key={props.model.holder.getID()} {...props} />,
    () => <SpriteWizard list={['default.png', 'prehistoric.png', 'SNES_MK1_reptile.png']}/>
  );
  mvf.register(
    DocTable,
    (props: {model: DocTable}) => <DocTableView key={props.model.holder.getID()} {...props}/>,
    null
    //() => <DocTableWizard model={model}/>
  );
  mvf.register(
    FileObject,
    (props: {model: FileObject}) => (
      <FileObjectView
        key={props.model.holder.getID()}
        createDoc={newObj => {
          return model.append(new DocHolder({doc: newObj})).then(() => newObj);
        }}
        prj={args.prj}
        {...props}
      />
    ),
    null
  );
  mvf.register(
    CSVFileObject,
    (props: {model: CSVFileObject}) => (
      <CSVFileView
        key={props.model.holder.getID()}
        createDoc={newObj => {
          return model.append(new DocHolder({doc: newObj})).then(() => newObj);
        }}
        prj={args.prj}
        {...props}
      />
    ),
    null
  );
  mvf.register(
    VideoFileObject,
    (props: {model: VideoFileObject}) => (
      <VideoFileView
        key={props.model.holder.getID()}
        createDoc={newObj => {
          return model.append(new DocHolder({doc: newObj})).then(() => newObj);
        }}
        prj={args.prj}
        {...props}
      />
    ),
    null
  );

  mvf.register(
    DocLayout,
    (props: {model: DocLayout}) => (
      <DocLayoutView {...props}/>
    ),
    null
  );

  let cont = document.createElement('div');
  document.body.appendChild(cont);

  ReactDOM.render(
    <DocRootView
      model={model}
      getView={(obj: DocHolder | FileObject) => (
        <DocView
          model={obj}
          onRemove={() => {
            model.remove(obj);
          }}>
          {
            obj instanceof DocHolder ? (
              mvf.getView(obj.getDoc().constructor, {model: obj.getDoc()})
            ) : (
              mvf.getView(obj.constructor, { model: obj })
            )
          }
        </DocView>
      )}
      getWizard={objClass => mvf.getWizard(objClass)}
      createObject={(objClass: OBJIOItemClass) => {
        /// const wzd = mvf.getWizard(objClass);
        /// const args: DocHolderArgs = wzd && await showWizard<DocHolderArgs>(wzd);
        const doc = mvf.create(objClass, {});
        return new DocHolder({doc});
      }}
    />,
    cont
  );
}

loadAndRender();
