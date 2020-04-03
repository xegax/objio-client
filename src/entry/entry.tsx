import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {
  createRequestor,
  OBJIOItem,
  createFactory,
  createOBJIO,
  OBJIORemoteStore,
  OBJIO,
  Requestor,
  Publisher
} from 'objio';
import { User } from 'objio/base/user';
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
import { Toaster, Position, Intent, Dialog, Classes as css } from '@blueprintjs/core';
import { ObjectBase } from 'objio-object/view/config';
import { confirm, OK } from 'ts-react-ui/prompt';
import { parseParams, getURL } from '../common/common';
import { showModal } from 'ts-react-ui/show-modal';
import { GuestModel } from '../model/base/guest';
import { GuestView } from '../view/guest';

Promise.config({ cancellation: true });

export const AppToaster = Toaster.create({
  position: Position.TOP,
});

async function initOBJIO(req: Requestor, prj: string, notify: () => void) {
  const factory = await createFactory();
  registerObjects(factory);

  const store = new OBJIORemoteStore({ req });
  const objio = await createOBJIO({
    factory,
    store,
    context: {
      objectsPath: '',
      filesPath: `/data/projects/${prj}/public/`
    }
  });

  objio.startWatch({ req, timeOut: 100 })
  .subscribe((objs: Array<OBJIOItem>) => {
    objs = objs || [];

    notify();
  });

  const typeMap: ObjTypeMap = {};
  const vf = new ViewFactory();
  Layout.initDocLayout(vf);

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
      vf.register(factItem);
    });
  });

  return { objio, vf, typeMap };
}

function renderGuest(objio: OBJIO, vf: ViewFactory): Publisher {
  const guest = new GuestModel({ objio, vf });
  showModal(
    <GuestView
      model={guest}
    />
  );
  return guest;
}

async function renderAdmin(objio: OBJIO, vf: ViewFactory, typeMap: ObjTypeMap): Promise<Publisher> {
  let model: App;
  let prj: Project;
  
  try {
    prj = await objio.loadObject<Project>();
    model = prj.getObjects().get(0) as App;
  } catch (e) {
    document.body.innerHTML = (e['data'] || e) + '';
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

  Objects.registerViews({
    classObj: App,
    views: [
      {
        view: (props: { model: App }) => {
          return (
            <AppView
              model={props.model}
              renderContent={(obj: ObjectBase) => {
                const objView = vf.getView({
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

  if (model.setTypeMap)
    model.setTypeMap(typeMap);

  model.setObjectsToCreate([
    ...Objects.getObjectsToCreate(),
    ...SQLITE3.getObjectsToCreate(),
    ...MYSQL.getObjectsToCreate(),
    ...Layout.getObjectsToCreate()
  ]);

  showModal(
    vf.getView({
      classObj: prj.constructor,
      props: { model: prj }
    })
  );

  return model.holder;
}

async function loadAndRender() {
  const { params, hash } = parseParams<{ prj: string }, { objId: string }>();;

  params.prj = params.prj || 'n1';
  const { req } = await User.openSession({
    req: createRequestor({ urlBase: '/handler', params: { prj: params.prj } }),
    onAuthError:  () => {
      if (!User.get().isGuest()) {
        location.assign(
          getURL('/login.html', { params, hash })
        );
        return Promise.resolve();
      }

      return (
        confirm({
          body: 'Session has been stopped by user inactivity',
          intent: Intent.WARNING,
          actions: [ OK ]
        }).then(() => {
          location.reload();
        })
      );
    }
  });

  const user = User.get();
  let pub: Publisher;
  const { objio, vf, typeMap } = await initOBJIO(
    req,
    params.prj,
    () => {
      pub && pub.notify();  
    }
  );

  if (user.isGuest())
    return pub = renderGuest(objio, vf);

  return pub = await renderAdmin(objio, vf, typeMap);
}

loadAndRender();
