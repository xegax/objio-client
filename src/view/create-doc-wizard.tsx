import * as React from 'react';
import { OBJIOItem, ExtPromise } from 'objio';
import { ViewFactory, FactoryItem } from 'objio-object/common/view-factory';
import { ListView } from 'ts-react-ui/list-view';
import { ContainerModel, ContItem } from 'ts-react-ui/container';
import { Dialog, Button, Intent, Classes as cs } from '@blueprintjs/core';
import { ConfigBase } from 'objio-object/view/config';
import { DocHolder, DocHolderArgs } from '../model/client/doc-holder';
import { FileObject } from 'objio-object/client/file-object';
import { ObjectBase } from 'objio-object/client/object-base';
import { App } from '../model/client/app';
import { PropSheet, PropsGroup, TextPropItem } from 'ts-react-ui/prop-sheet';

import './create-doc-wizard.scss';

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

export class CreateDocWizard extends React.Component<Props> {
  state: Partial<State> = {};
  ref = React.createRef<ConfigBase>();
  newObjectName: string;

  getItemsToCreate(): Array<Item> {
    let items = this.props.vf.getItems();

    items = items.filter(item => (item.flags as Set<string>).has('create-wizard'));
    
    const sources = this.getRootObjects();
    items = items.filter(item => {
      if (!item.sources || item.sources.length == 0)
        return true;

      return item.sources.some(bunch => bunch.every( (source: any) => {
        return sources.some(obj => obj instanceof source);
      }));
    });

    return items.map(item => {
      return {
        value: item.description,
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

  getRootObjects = (): Array<ObjectBase> => {
    return this.props.root.getObjectsBase();
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
  const p = ExtPromise<OBJIOItem>().deferred();

  let dialogCont: ContItem;
  const onOK = (okArgs: OKArgs) => {
    if (!okArgs)
      return;

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
  };

  dialogCont = ContainerModel.get().append(
    <CreateDocWizard
      source={source}
      root={root}
      vf={vf}
      onOK={okArgs => onOK(okArgs)}
      onCancel={() => {
        dialogCont.remove();
        p.reject();
      }}
    />
  );

  return p;
}
