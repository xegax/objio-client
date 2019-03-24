import * as React from 'react';
import { OBJIOItem, OBJIOItemClass } from 'objio';
import { ViewFactory, FactoryItem } from 'objio-object/common/view-factory';
import { ListView } from 'ts-react-ui/list-view';
import { ContainerModel, ContItem } from 'ts-react-ui/container';
import { Dialog, Button, Intent, Classes as cs } from '@blueprintjs/core';
import { ConfigBase } from 'objio-object/view/config';
import { DocHolder, DocHolderArgs } from '../model/client/doc-holder';
import { FileObjectBase as FileObject } from 'objio-object/base/file-object';
import { ObjectBase } from 'objio-object/base/object-base';
import { App } from '../model/client/app';
import { PropSheet, PropsGroup, TextPropItem } from 'ts-react-ui/prop-sheet';
import { Icon } from 'ts-react-ui/icon';
import { OBJIOItemClassViewable } from 'objio-object/view/config';
import * as UnknownTypeIcon from '../images/unknown-type.png';

import './create-doc-wizard.scss';
import { DocHolderBase } from '../model/base/doc-holder';

interface Item {
  value: string;
  factItem: FactoryItem;
}

const classes = {
  wizard: 'create-doc-wizard',
  objects: 'object-list',
  objectParams: 'object-params'
};

interface OKArgs {
  item: FactoryItem;
  args: Partial<Object>;
  name: string;
}

interface Props {
  source: ObjectBase;
  root: App;
  vf: ViewFactory;
  onOK(args: OKArgs);
  onCancel();
}

interface State {
  item: FactoryItem;
}

function isInstanceOf(base: Object, tgtClass: Object) {
  do {
    if (base == tgtClass)
      return true;

    tgtClass = tgtClass['__proto__'];
  } while (tgtClass);

  return false;
}

export class CreateDocWizard extends React.Component<Props> {
  state: Partial<State> = {};
  ref = React.createRef<ConfigBase>();
  newObjectName: string;

  getTypesMap(items?: Array<FactoryItem>) {
    const typeMap: {[type: string]: OBJIOItemClass} = {};
    (items || this.props.vf.getItems()).forEach(item => {
      typeMap[item.classObj.TYPE_ID] = item.classObj;
    });

    return typeMap;
  }

  getItemsToCreate(): Array<Item> {
    let items = this.props.vf.getItems();
    const typeMap = this.getTypesMap(items);

    items = items.filter(item => (item.flags as Set<string>).has('create-wizard'));
    
    const sources = this.getRootObjects().map(holder => typeMap[holder.getObjType()]);
    items = items.filter(item => {
      if (!item.sources || item.sources.length == 0)
        return true;

      return item.sources.some(bunch => {
        return bunch.every((baseSource: any) => {
          return sources.some(obj => isInstanceOf(baseSource, obj));
        });
      });
    });

    return items.map(item => {
      const viewable = item.classObj as OBJIOItemClassViewable;
      let icon: JSX.Element;
      if (viewable.getViewDesc) {
        icon = ({...viewable.getViewDesc()}.icons || {}).item;
      }

      const name = item.description;
      return {
        value: name,
        render: () => (
          <div className='horz-panel-1' style={{display: 'flex', alignItems: 'center'}}>
            {icon || <Icon src={UnknownTypeIcon}/>}
            <span>{name}</span>
          </div>
        ),
        factItem: item
      };
    }).sort((a, b) => a.value.localeCompare(b.value));
  }

  renderConfig(item: FactoryItem) {
    if (!item)
      return null;

    let config: JSX.Element = null;
    if (item.config) {
      config = item.config({
        objects: this.getRootObjects,
        source: this.props.source
      });
      config = React.cloneElement(config, {key: item.classObj.TYPE_ID, ref: this.ref});
    }

    this.newObjectName = `new ${item.description || item.classObj.TYPE_ID}`;
    return (
      <div className={classes.objectParams} key={item.classObj.TYPE_ID}>
        <PropSheet>
          <PropsGroup label='common'>
            <TextPropItem
              label='name'
              value={this.newObjectName}
              onEnter={value => {
                this.newObjectName = value;
              }}
            />
          </PropsGroup>
          { config }
        </PropSheet>
      </div>
    );
  }

  componentDidMount() {
  }

  getRootObjects = (filter?: Array<OBJIOItemClass>): Array<ObjectBase> => {
    let objs = this.props.root.getObjects();
    if (!filter || filter.length == 0)
      return objs;

    const typeMap = this.getTypesMap();
    return objs.filter(obj => {
      return filter.some(base => isInstanceOf(base, typeMap[obj.getObjType()] ))
    });
  }

  render() {
    const item = this.state.item;
    return (
      <Dialog isOpen={true} isCloseButtonShown={false} title='create new' style={{width: 600}}>
        <div className={cs.DIALOG_BODY}>
          <div className={classes.wizard}>
            <div className={classes.objects}>
              <ListView
                values={this.getItemsToCreate()}
                style={{flexGrow: 1}}
                onSelect={(item: Item) => {
                  this.setState({ item: item.factItem });
                }}
              />
            </div>
            {this.renderConfig(this.state.item)}
          </div>
        </div>
        <div className={cs.DIALOG_FOOTER}>
          <div className={cs.DIALOG_FOOTER_ACTIONS}>
            <Button
              text='OK'
              intent={Intent.PRIMARY}
              onClick={() => {
                this.props.onOK({
                  item,
                  args: this.ref && this.ref.current && this.ref.current.getConfig() || {},
                  name: this.newObjectName
                });
              }}
            />
            <Button text='Cancel' onClick={this.props.onCancel}/>
          </div>
        </div>
      </Dialog>
    );
  }
}

export function createDocWizard(root: App, vf: ViewFactory, source?: ObjectBase): Promise<OBJIOItem> {
  const p = Promise.defer<OBJIOItem>();

  let dialogCont: ContItem;
  const onOK = (okArgs: OKArgs) => {
    if (!okArgs)
      return;

    let toLoad = Array<{obj: DocHolderBase, key: string}>();
    Object.keys(okArgs.args)
    .forEach(k => {
      const obj = okArgs.args[k];
      if (!(obj instanceof DocHolderBase))
        return;

      if (!obj.isLoaded())
        toLoad.push({ obj, key: k });
      else
        okArgs[k] = obj.get();
    });
    
    let load = toLoad.length ? Promise.all(toLoad.map(item => item.obj.load()))
    .then(arr => {
      arr.forEach((obj, i) => {
        okArgs.args[ toLoad[i].key ] = obj;
      });
    }) : Promise.resolve();

    load.then(() => {
      let newObj = okArgs.item.classObj.create({source, ...okArgs.args}) as ObjectBase;
      newObj.setName(okArgs.name);

      const args: DocHolderArgs = { doc: newObj };
      if (source) {
        if (source instanceof FileObject) {
          newObj.setName(source.getName());
        } else {
          newObj.setName(OBJIOItem.getClass(source).TYPE_ID);
        }
      }

      root.append(new DocHolder(args))
      .then(() => {
        p.resolve(newObj);

        // close dialog
        dialogCont.remove();
      });
    });
  };

  dialogCont = ContainerModel.get().append(
    <CreateDocWizard
      source={source}
      root={root}
      vf={vf}
      onOK={okArgs => onOK(okArgs)}
      onCancel={() => {
        dialogCont.remove();
        p.reject(new Error('cancel'));
      }}
    />
  );

  return p.promise;
}
