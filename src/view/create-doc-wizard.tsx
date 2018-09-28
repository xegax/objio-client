import * as React from 'react';
import { OBJIOItem, ExtPromise } from 'objio';
import { ViewFactory, FactoryItem } from '../common/view-factory';
import { List, RenderListModel } from 'ts-react-ui/list';
import { RenderArgs } from 'ts-react-ui/model/list';
import { FitToParent } from 'ts-react-ui/fittoparent';
import './create-doc-wizard.scss';
import { ContainerModel, ContItem } from 'ts-react-ui/container';
import { Dialog, Button, Intent, Classes as cs } from '@blueprintjs/core';
import { DocConfig } from './doc-config';
import { DocRoot } from '../model/client/doc-root';
import { DocHolder, DocHolderArgs } from '../model/client/doc-holder';
import { FileObject } from 'objio-object/client/file-object';
import { ObjectBase } from 'objio-object/client/object-base';

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
  name = React.createRef<HTMLInputElement>();

  componentDidMount() {
    const { vf } = this.props;
    let items = vf.getItems();
    /* if (source)
      items = vf.findBySource( OBJIOItem.getClass(source) );
    */

    items = items.filter(item => (item.flags as Set<string>).has('create-wizard'));
    
    const sources = this.getRootObjects();
    items = items.filter(item => {
      if (!item.sources || item.sources.length == 0)
        return true;

      return item.sources.some(bunch => bunch.every( (source: any) => {
        return sources.some(obj => obj instanceof source);
      }));
    });

    const list = new RenderListModel( items.length );
    list.setHandler({
      loadItems: (from, count) => {
        return items.slice(from, from + count);
      }
    });

    list.setColumns([{
      name: 'object name',
      render: (args: RenderArgs<FactoryItem>) => {
        return <div>{args.item.description}</div>;
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
    list.setSelRow(0);

    this.setState({list});
  }

  getRootObjects = (): Array<ObjectBase> => {
    return [
      ...this.props.root.getFiles(),
      ...this.props.root.getDocs().map(holder => holder.getDoc())
    ];
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
            <div className={classes.objectParams} key={item && item.classObj.TYPE_ID}>
              { item && <div>name: <input ref={this.name} defaultValue={`new ${item.description || item.classObj.TYPE_ID}`}/></div> }
              { item && item.config && React.cloneElement(item.config({
                  objects: this.getRootObjects,
                  source: this.props.source
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
                this.props.onOK({
                  item,
                  args: this.ref && this.ref.current && this.ref.current.getConfig() || {},
                  name: this.name.current.value
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

export function createDocWizard(root: DocRoot, vf: ViewFactory, source?: ObjectBase): Promise<OBJIOItem> {
  let p = ExtPromise<OBJIOItem>().deferred();

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
