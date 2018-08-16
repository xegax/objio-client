import * as React from 'react';
import { DocLayout as Base, DataSourceHolder } from '../server/doc-layout';
import { LayoutModel, clone, LayoutCont } from 'ts-react-ui/model/layout';
import { OBJIOItem } from 'objio';
import { DocHolder } from './doc-holder';
import { select } from '../../view/prompt';
import { Condition } from 'objio-object/table';

export class DocLayout extends Base {
  private model = new LayoutModel();

  constructor() {
    super();

    this.holder.addEventHandler({
      onObjChange: () => {
        this.model.setLayout( clone(this.layout) as LayoutCont );
        this.model.delayedNotify();
      },
      onLoad: () => {
        this.objects.holder.addEventHandler({
          onObjChange: () => {
            this.updateLayoutMap();
            this.model.delayedNotify();
          }
        });

        this.model.setLayout( clone(this.layout) as LayoutCont );
        this.updateLayoutMap();
        return Promise.resolve();
      }
    });

    this.model.subscribe(() => {
      this.holder.getObject(this.model.getLastDrop().id)
      .then((obj: DocHolder) => {
        const views = DataSourceHolder.findAllViews( OBJIOItem.getClass(obj.getDoc()) );

        if (views.length == 1)
          return views[0].object({source: obj.getDoc(), layout: this, viewType: views[0].viewType});

        return select({
          items: views.map(view => view.viewType)
        }).then(view => {
          return views.find(v => v.viewType == view).object({source: obj.getDoc(), layout: this, viewType: view});
        });
      })
      .then((holder: DataSourceHolder) => this.holder.createObject(holder))
      .then((holder: DataSourceHolder) => {
        this.model.getLastDrop().id = holder.holder.getID();
        this.objects.push(holder);

        this.objects.holder.save();
        this.layout = clone(this.model.getLayout()) as LayoutCont;
        this.holder.save();
        this.updateLayoutMap();
      });
    }, 'drop');

    this.model.subscribe(() => {
      this.layout = clone(this.model.getLayout()) as LayoutCont;
      this.holder.save();
    }, 'change');
  }

  updateLayoutMap() {
    const map: {[id: string]: JSX.Element} = {};
    this.objects.getArray().forEach((obj: DataSourceHolder) => {
      const id = obj.holder.getID();
      const jsx: JSX.Element = obj.getView() || (
        <React.Fragment>
          <div>object {this.holder.getID()}</div>
          <div>data object {obj.get().holder.getID()}</div>
          <div>type {OBJIOItem.getClass(obj.get()).TYPE_ID}</div>
        </React.Fragment>
      );

      map[id] = (
        <div style={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          border: '1px solid gray'
        }}>
          <div style={{flexGrow: 0, display: 'flex', backgroundColor: 'silver'}}>
            <div style={{flexGrow: 1}}>header</div>
            <div style={{flexGrow: 0}}>
              <i
                onClick={() => {
                  this.model.remove(id);
                  this.layout = clone( this.model.getLayout() ) as LayoutCont;
                  this.holder.save();
                  const idx = this.objects.find(obj => obj.holder.getID() == id);
                  this.objects.remove(idx);
                  this.objects.holder.save();
                }}
                style={{cursor: 'pointer'}}
                className='fa fa-remove'
              />
            </div>
          </div>
          {jsx}
        </div>
      );
    });
    this.model.setMap(map);
  }

  getLayout(): LayoutModel {
    return this.model;
  }
}