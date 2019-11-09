import * as React from 'react';
import { ListView } from 'ts-react-ui/list-view';
import { ContainerModel, ContItem } from 'ts-react-ui/container';
import { Dialog, Button, Intent, Classes as cs } from '@blueprintjs/core';
import { ObjectBase } from 'objio-object/base/object-base';
import { PropSheet, PropsGroup, TextPropItem } from 'ts-react-ui/prop-sheet';
import { Icon } from 'ts-react-ui/icon';
import * as UnknownTypeIcon from '../images/unknown-type.png';
import { ObjectToCreate } from 'objio-object/common/interfaces';

import './create-doc-wizard.scss';

interface Item {
  value: string;
  item: ObjectToCreate;
}

const classes = {
  wizard: 'create-doc-wizard',
  objects: 'object-list',
  objectParams: 'object-params'
};

interface OKArgs {
  object: ObjectToCreate;
  name: string;
}

interface Props {
  objects: Array<ObjectToCreate>
  onOK(args: OKArgs): void;
  onCancel(): void;
}

interface State {
  name?: string;
  object?: ObjectToCreate;
}

function isInstanceOf(base: Object, tgtClass: Object) {
  do {
    if (base == tgtClass)
      return true;

    tgtClass = tgtClass['__proto__'];
  } while (tgtClass);

  return false;
}

export class CreateDocWizard extends React.Component<Props, State> {
  state: State = {};

  getItemsToCreate(): Array<Item> {
    return this.props.objects.map(item => {
      return {
        value: item.name,
        render: () => (
          <div className='horz-panel-1' style={{display: 'flex', alignItems: 'center'}}>
            {item.icon || <Icon src={UnknownTypeIcon}/>}
            <span>{item.name}</span>
          </div>
        ),
        item
      };
    }).sort((a, b) => a.value.localeCompare(b.value));
  }

  renderConfig() {
    if (!this.state.object)
      return;

    return (
      <div className={classes.objectParams} key={this.state.object.name}>
        <PropSheet fitToAbs>
          <PropsGroup label='general'>
            <TextPropItem
              label='name'
              value={this.state.name || this.state.object.name}
              onEnter={name => {
                this.setState({ name });
              }}
            />
          </PropsGroup>
        </PropSheet>
      </div>
    );
  }

  render() {
    return (
      <Dialog isOpen={true} isCloseButtonShown={false} title='create new' style={{width: 600}}>
        <div className={cs.DIALOG_BODY}>
          <div className={classes.wizard}>
            <div className={classes.objects}>
              <ListView
                values={this.getItemsToCreate()}
                style={{flexGrow: 1}}
                onSelect={(item: Item) => {
                  this.setState({ object: item.item });
                }}
              />
            </div>
            {this.renderConfig()}
          </div>
        </div>
        <div className={cs.DIALOG_FOOTER}>
          <div className={cs.DIALOG_FOOTER_ACTIONS}>
            <Button
              text='OK'
              intent={Intent.PRIMARY}
              onClick={() => {
                this.props.onOK({
                  object: this.state.object,
                  name: this.state.name || this.state.object.name
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

export function createDocWizard(objects: Array<ObjectToCreate>): Promise<ObjectBase> {
  const result = Promise.defer<ObjectBase>();

  let dialogCont: ContItem;
  const onOK = (okArgs: OKArgs) => {
    if (!okArgs)
      return;
    
    let newObj = okArgs.object.create();
    newObj.setName(okArgs.name);
    dialogCont.remove();
    result.resolve(newObj);
  };

  dialogCont = ContainerModel.get().append(
    <CreateDocWizard
      objects={objects}
      onOK={okArgs => onOK(okArgs)}
      onCancel={() => {
        dialogCont.remove();
        result.reject(new Error('cancel'));
      }}
    />
  );

  return result.promise as Promise<ObjectBase>;
}
