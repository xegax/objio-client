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
  DocHolder
} from '../model/client/register-objects';
import { ViewFactory, FactoryItem } from 'objio-object/common/view-factory';

import { FileObject } from 'objio-object/client/file-object';

import '../../styles/styles.scss';
import 'ts-react-ui/_base.scss';
import 'objio-object/styles/all.scss';
import { DocView } from '../view/doc-view';

import * as Layout from 'objio-layout/view';
import * as Objects from 'objio-object/view';
import * as MYSQL from 'objio-mysql-database/view';
import * as SQLITE3 from 'objio-sqlite-table/view';
import { Project } from 'objio/project/client/project';
import { App, AppView } from '../view/app-view';

import { Toaster, Position, Intent } from '@blueprintjs/core';

Promise.config({ cancellation: true });

export const AppToaster = Toaster.create({
  position: Position.TOP,
});

let objio: OBJIO;

function parseParams(args: string): { [key: string]: string } {
  const res = {};
  args.split('&').forEach(item => {
    const pair = item.split('=');
    res[pair[0]] = pair[1];
  });
  return res;
}

async function loadAndRender() {
  const p = window.location.search.split('?')[1] || '';
  const args: { prj?: string, objId?: string } = parseParams(p);

  let factory = await createFactory();
  registerObjects(factory);

  args.prj = args.prj || 'n1';
  const rootReq = createRequestor({ urlBase: '/handler', params: { prj: args.prj } });
  const req = new AuthRequestor({ req: rootReq, showLogin });
  const store = new OBJIORemoteStore({ req });
  /*let store = await createLocalStore(factory);
  try {
    store.load(JSON.parse(localStorage.getItem('objio')));
  } catch(e) {
    console.log('localStorage can not be loaded');
  }*/
  objio = await createOBJIO({ factory, store, context: { objectsPath: '', filesPath: `/data/projects/${args.prj}/public/` } });

  /*objio.addObserver({
    onSave: () => {
      console.log('saving ' + Date.now());
      localStorage.setItem('objio', JSON.stringify(store.save()));
    }
  });*/

  let mvf = new ViewFactory();
  Layout.initDocLayout(mvf as any);

  let model: App;
  let prj: Project;
  try {
    prj = await objio.loadObject<Project>();
    model = prj.getObjects().get(0) as App;
    if (!model)
      await prj.appendObject(new App());
  } catch (e) {
    document.body.innerHTML = (e['data'] || e) + '';
    return;
  }

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

  let obj: OBJIOItem;
  try {
    if (args.objId)
      obj = await objio.getObject(args.objId);
  } catch (e) {
  }

  objio.startWatch({ req, timeOut: 100 })
    .subscribe((objs: Array<OBJIOItem>) => {
      objs = objs || [];

      model.holder.notify();
    });

  Objects.registerViews({
    classObj: DocHolder,
    views: [{
      view: (props: { model: DocHolder, root: App }) => {
        const doc = props.model.getDoc();
        return (
          <DocView {...props}>
            {mvf.getView({ classObj: doc.constructor, props: { model: doc } })}
          </DocView>
        );
      }
    }]
  });

  Objects.registerViews({
    classObj: App,
    views: [
      {
        view: (props: { model: App }) => {
          return (
            <AppView
              model={props.model}
              vf={mvf}
              renderContent={(obj: DocHolder | FileObject) => {
                const objView = mvf.getView({
                  classObj: obj.constructor,
                  props: {
                    model: obj,
                    key: obj.holder.getID(),
                    root: props.model
                  }
                });

                if (obj instanceof DocHolder)
                  return objView;

                return (
                  <DocView
                    model={obj}
                    root={props.model}
                    key={obj.holder.getID()}
                  >
                    {objView}
                  </DocView>
                );
              }}
            />
          );
        }
      }
    ]
  });

  [
    DocHolder,
    ...Layout.getViews(),
    ...Objects.getViews(),
    ...SQLITE3.getViews(),
    ...MYSQL.getViews()
  ].forEach(classObj => {
    if (!classObj.getViewDesc)
      return;

    const viewDesc = classObj.getViewDesc();
    (viewDesc.views || []).forEach(viewItem => {
      const factItem: FactoryItem = {
        classObj,
        view: viewItem.view,
        createObject: args => classObj.create(args)
      };

      if (viewDesc.config)
        factItem.config = props => viewDesc.config(props);

      if (viewItem.viewType)
        factItem.viewType = viewItem.viewType;

      if (viewDesc.sources)
        factItem.sources = viewDesc.sources;

      factItem.flags = viewDesc.flags;
      factItem.description = viewDesc.desc;
      mvf.register(factItem);
    });
  });

  let cont = document.createElement('div');
  document.body.appendChild(cont);
  document.body.style.overflow = 'hidden';

  if (obj) {
    cont.className = 'doc-cont-view';
    ReactDOM.render(
      mvf.getView({ classObj: obj.constructor, props: { model: obj } }),
      cont
    );
  } else {
    ReactDOM.render(
      mvf.getView({
        classObj: prj.constructor,
        props: { model: prj }
      }),
      cont
    );
  }
}

loadAndRender();
