import * as React from 'react';
import { OBJIOItem, OBJIOItemClass } from 'objio';
import { ViewFactory, FactoryItem } from '../common/view-factory';
import { List, RenderListModel } from 'ts-react-ui/list';
import { RenderArgs } from 'ts-react-ui/model/list';
import { FitToParent } from 'ts-react-ui/fittoparent';
import './create-doc-wizard.scss';
import { ContainerModel, ContItem } from 'ts-react-ui/container';
import { Dialog, Button, Intent, Classes as cs } from '@blueprintjs/core';
import { DocConfig } from './doc-config';
import { DocRoot } from '../model/client/doc-root';
import { DocHolder } from '../model/client/doc-holder';

const classes = {
  wizard: 'create-doc-wizard',
  objects: 'object-list',
  objectParams: 'object-params'
};

interface OKArgs {
  item: FactoryItem;
  args: Partial<Object>;
}

interface Props {
  root: DocRoot;
  vf: ViewFactory;
  onOK(args: OKArgs);
  onCancel();
}

interface State {
  list: RenderListModel;
  item: FactoryItem;
}

export class CreateDocWizard extends React.Component<Props> {
  state: Partial<State> = {};
  ref = React.createRef<DocConfig>();

  componentDidMount() {
    const items = this.props.vf.getItems();
    const list = new RenderListModel( items.length );
    list.setHandler({
      loadItems: (from, count) => {
        return items.slice(from, from + count);
      }
    });

    list.setColumns([{
      name: 'object name',
      render: (args: RenderArgs<FactoryItem>) => {
        const classObj = args.item.classObj as OBJIOItemClass;
        return <div>{classObj.TYPE_ID}</div>;
      }
    }]);
    list.setHeader(false);
    list.subscribe(() => {
      if (list.getSelCount()) {
        const items = list.getItems(list.getSelRow(), 1);
        this.setState({item: items[0]});
      } else {
        this.setState({item: null});
      }
    }, 'select-row');

    this.setState({list});
  }

  render() {
    const item = this.state.item;
    return (
      <Dialog isOpen={true} isCloseButtonShown={false} title='create new document' style={{width: 600}}>
        <div className={cs.DIALOG_BODY}>
          <div className={classes.wizard}>
            <div className={classes.objects}>
              <FitToParent wrapToFlex>
                <List model={this.state.list}/>
              </FitToParent>
            </div>
            <div className={classes.objectParams}>
              { item && item.config && React.cloneElement(item.config({
                  root: this.props.root
                }), {key: item.classObj.TYPE_ID, ref: this.ref}) || null }
            </div>
          </div>
        </div>
        <div className={cs.DIALOG_FOOTER}>
          <div className={cs.DIALOG_FOOTER_ACTIONS}>
            <Button
              text='OK'
              intent={Intent.PRIMARY}
              onClick={() => {
                this.props.onOK({item, args: this.ref && this.ref.current.getConfig() || {} });
              }}
            />
            <Button text='Cancel' onClick={this.props.onCancel}/>
          </div>
        </div>
      </Dialog>
    );
  }
}

export function createDocWizard(root: DocRoot, vf: ViewFactory): Promise<OBJIOItem> {
  return new Promise((resolve, reject) => {
    let item: ContItem;
    const onResult = (okArgs: OKArgs) => {
      if (okArgs) {
        let doc = okArgs.item.classObj.create(okArgs.args);
        root.append(new DocHolder({ doc }))
        .then(() => resolve(doc));
      } else {
        reject();
      }
      item.remove();
    };

    item = ContainerModel.get().append(
      <CreateDocWizard
        root={root}
        vf={vf}
        onOK={okArgs => onResult(okArgs)}
        onCancel={() => onResult(null)}
      />
    );
  });
}
