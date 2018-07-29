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
  DocContainer,
  DocDummy,
  DocHolder,
  DocSpriteSheet,
  DocProcess,
  DocTable
} from '../model/client/register-objects';
import { DocContView } from '../view/doc-cont-view';
import { ModelViewFactory } from '../view/register-objects';
import { SpriteSheetView, SpriteWizard } from '../view/sprite-sheet';

import { DocTableView, DocTableWizard } from '../view/doc-table-view';
import { FileObject } from 'objio-object/file-object';
import { CSVFileObject } from 'objio-object/csv-file-object';
import { FileObjectView } from '../view/file-object-view'; 
import '../../styles/styles.scss';

let objio: OBJIO;

async function loadAndRender() {
  const p = window.location.search.split('?')[1] || '';
  const args: {prj?: string} = {};
  p.split('&').forEach(item => {
    const pair = item.split('=');
    args[pair[0]] = pair[1];
  });

  let factory = await createFactory();
  registerObjects(factory);

  const rootReq = createRequestor({urlBase: '/handler', params: {prj: args.prj || 'n1'}});
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

  let model: DocContainer;
  try {
    model = await objio.loadObject<DocContainer>('0');
  } catch (e) {
    model = await objio.createObject<DocContainer>(new DocContainer());
    model.getHolder().save();
  }

  objio.startWatch({req, timeOut: 100}).subscribe(() => {
    model.getPublisher().notify();
  });

  let mvf = new ModelViewFactory<OBJIOItem>();
  mvf.register(DocDummy, () => <div>DocDummy view</div>, null);
  mvf.register(
    DocSpriteSheet,
    (props: {model: DocSpriteSheet}) => <SpriteSheetView key={props.model.holder.getID()} {...props} />,
    () => <SpriteWizard list={['default.png', 'prehistoric.png', 'SNES_MK1_reptile.png']}/>
  );
  mvf.register(DocProcess, (props: {model: DocProcess}) => {
    return (
      <div key={props.model.holder.getID()} >
        <div>progress: {props.model.getProgress()}</div>
        <button onClick={e => props.model.run()}>start</button>
      </div>
    );
  }, null);
  mvf.register(
    DocTable,
    (props: {model: DocTable}) => <DocTableView key={props.model.holder.getID()} {...props}/>,
    () => <DocTableWizard model={model}/>
  );
  mvf.register(
    FileObject,
    (props: {model: FileObject}) => (
      <FileObjectView
        createDoc={newObj => {
          return model.append(new DocHolder({doc: newObj})).then(() => newObj);
        }}
        prj={args.prj}
        {...props}
      />
    ),
    null
  );

  let cont = document.createElement('div');
  document.body.appendChild(cont);

  ReactDOM.render(
    <DocContView
      model={model}
      getView={model => mvf.getView(model.constructor, {model})}
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
