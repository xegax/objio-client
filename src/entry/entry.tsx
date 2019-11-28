import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {
  AuthCheckRequestor,
  createRequestor,
  OBJIOItem,
  createFactory,
  createOBJIO,
  OBJIORemoteStore,
  OBJIO,
  Requestor
} from 'objio';
import {
  registerObjects
} from '../model/client/register-objects';
import { ViewFactory, FactoryItem } from 'objio-object/common/view-factory';

import '../../styles/styles.scss';
import 'ts-react-ui/_base.scss';
import 'objio-object/styles/all.scss';
import * as Layout from 'objio-layout/view';
import * as Objects from 'objio-object/view';
import * as MYSQL from 'objio-mysql-database/view';
import * as SQLITE3 from 'objio-sqlite-table/view';
import { Project } from 'objio/project/client/project';
import { App, AppView, ObjTypeMap } from '../view/app-view';
import { Toaster, Position, Intent } from '@blueprintjs/core';
import { ObjectBase } from 'objio-object/view/config';
import { showLogin } from 'ts-react-ui/forms/login';

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

async function login(req: Requestor) {
  try {
    await req.getJSON({ url: 'objio/check' });
  } catch(err) {
    let error: string;
    while(true) {
      const { login, pass: passwd } = await showLogin(error);
      const res = await req.getJSON({ url: 'objio/login', postData: { login, passwd }});
      if (!res.error) {
        req.setCookie({ sessId: res.sessId });
        break;
      }
    }
  }
}

async function loadAndRender() {
  const p = window.location.search.split('?')[1] || '';
  const args: { prj?: string, objId?: string } = parseParams(p);

  let factory = await createFactory();
  registerObjects(factory);

  args.prj = args.prj || 'n1';
  const rootReq = createRequestor({ urlBase: '/handler', params: { prj: args.prj } });
  await login(rootReq);
  const req = new AuthCheckRequestor({
    req: rootReq,
    onAuthError: () => {
      location.reload();
      return new Promise(() => {});
    }
  });
  const store = new OBJIORemoteStore({ req });
  objio = await createOBJIO({
    factory,
    store,
    context: {
      objectsPath: '',
      filesPath: `/data/projects/${args.prj}/public/`
    }
  });

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
    if (!model) {
      model = new App();
      await prj.appendObject(model);
    }
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
    classObj: App,
    views: [
      {
        view: (props: { model: App }) => {
          return (
            <AppView
              model={props.model}
              renderContent={(obj: ObjectBase) => {
                const objView = mvf.getView({
                  classObj: obj.constructor,
                  props: {
                    model: obj,
                    key: obj.holder.getID(),
                    root: props.model
                  }
                });

                return objView;
              }}
            />
          );
        }
      }
    ]
  });

  const typeMap: ObjTypeMap = {};
  [
    ...Layout.getViews(),
    ...Objects.getViews(),
    ...SQLITE3.getViews(),
    ...MYSQL.getViews()
  ].forEach(classObj => {
    typeMap[classObj.TYPE_ID] = classObj;
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

  if (model['setTypeMap'])
    model.setTypeMap(typeMap);
  model.setObjectsToCreate([
    ...Objects.getObjectsToCreate(),
    ...SQLITE3.getObjectsToCreate(),
    ...MYSQL.getObjectsToCreate(),
    ...Layout.getObjectsToCreate()
  ]);

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
