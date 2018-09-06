import * as React from 'react';
import { DocTreeItem } from '../model/client/doc-root';
import { DocSpriteSheet } from '../model/doc-sprite-sheet';
import { Menu, ContextMenu, MenuItem } from '@blueprintjs/core';
import { DocTable } from 'objio-object/client/doc-table';
import { OBJIOItemClass, OBJIOItem } from 'objio';
import { createFileObject } from 'objio-object/client';
import { FileArgs, FileObject } from 'objio-object/client/file-object';
import { Tree } from 'ts-react-ui/tree';
import { FitToParent } from 'ts-react-ui/fittoparent';
import { DocLayout } from '../model/client/doc-layout';
import { Draggable } from 'ts-react-ui/drag-and-drop';
import { DocRoot } from '../model/client/doc-root';
import './doc-root.scss';
import { createDocWizard } from './create-doc-wizard';
import { ViewFactory } from '../common/view-factory';
import { DocHolder } from '../model/client/doc-holder';

const classes = {
  docContView: 'doc-cont-view',
  docList: 'doc-list',
  docContent: 'doc-content',
  listItem: 'doc-list-item',
  listItemSelect: 'doc-list-item-select'
};

export {
  DocRoot
};

interface Props {
  vf: ViewFactory;
  model: DocRoot;
  getView: (doc: OBJIOItem) => JSX.Element;
}

interface State {
  fileDrop?: boolean;
}

export class DocRootView extends React.Component<Props, State> {
  private subscriber = () => {
    this.setState({});
  };

  state: Readonly<State> = {};
  private dropTgt: React.Ref<HTMLDivElement> = React.createRef<HTMLDivElement>();

  componentDidMount() {
    this.props.model.holder.subscribe(this.subscriber);
  }

  componentWillUnmount() {
    this.props.model.holder.unsubscribe(this.subscriber);
  }

  createObject(objClass: OBJIOItemClass): Promise<OBJIOItem> {
    return Promise.resolve(null);
    /*const obj = this.props.createObject(objClass);
    return (
      this.props.model.append(obj)
      .then(() => {
        const wzrd = this.props.getWizard(objClass);
        if (wzrd)
          showWizard(wzrd).then(args => obj.execute(args));

        return obj;
      })
    );*/
  }

  /*showWizard(objClass: OBJIOItemClass): JSX.Element {
    return this.props.getWizard(objClass);
  }*/

  onContextMenu = (e: React.MouseEvent<any>) => {
    e.preventDefault();
    e.stopPropagation();

    const items = [
      <MenuItem key='append' text='append'>
        <MenuItem text='sprite' onClick={() => this.createObject(DocSpriteSheet)}/>
        <MenuItem text='table' onClick={() => this.createObject(DocTable)}/>
        <MenuItem text='layout' onClick={() => this.createObject(DocLayout)}/>
      </MenuItem>,
      <MenuItem key='delete' text='delete' onClick={() => {
        this.props.model.remove(this.props.model.getSelect());
      }}/>
    ];

    ContextMenu.show(<Menu>{items}</Menu>, {left: e.clientX, top: e.clientY});
  }

  renderTreeItem = (item: DocTreeItem, jsx: JSX.Element): JSX.Element => {
    if (!item.obj)
      return jsx;

    const select = this.props.model.getSelect() == item.obj;
    return (
      <Draggable data={{id: item.obj.holder.getID()}}>
        <span style={{ color: select ? 'red' : null }}>{jsx}</span>
      </Draggable>
    );
  }

  renderItems() {
    return (
      <div
        key='doc-list' className={classes.docList}
        style={{display: 'flex', flexDirection: 'column'}}
        onContextMenu={e => this.onContextMenu(e)}
      >
        <button
          onClick={() => {
            createDocWizard(this.props.model, this.props.vf)
            .catch(() => {
              console.log('create cancel');
            });
          }}>
          create
        </button>
        <FitToParent wrapToFlex>
          <Tree
            model={this.props.model.getTree()}
            renderItem={this.renderTreeItem}
          />
        </FitToParent>
      </div>
    );
  }

  renderDoc() {
    const doc = this.props.model.getSelect();
    const view = doc ? this.props.getView(doc) : null;
    return (
      <div className={classes.docContent}>
        {view || 'Document does not have a view'}
      </div>
    );
  }

  onDragEnter = (event: React.DragEvent<any>) => {
    const data = event.nativeEvent.dataTransfer;
    if (!data.items)
      return;

    for (let n = 0; n < data.items.length; n++) {
      const item = data.items[n];
      if (item.kind != 'file')
        continue;

      this.setState({fileDrop: true});
      break;
    }
  };

  onDrop = (event: React.DragEvent<any>) => {
    event.preventDefault();
    if (!this.state.fileDrop)
      return;

    const file = event.dataTransfer.items[0].getAsFile();
    const fileArgs: FileArgs = {
      name: file.name,
      size: file.size,
      mime: file.type
    };
    
    let select = this.props.model.getSelect();
    let holder = select as DocHolder;
    let fileObj = select as FileObject;

    if (holder instanceof DocHolder && 'sendFile' in holder.getDoc()) {
      (holder.getDoc() as any).sendFile(file);
    } else if (fileObj && 'sendFile' in fileObj) {
      fileObj.sendFile(file);
    } else {
      let newFileObj = createFileObject(fileArgs);
      this.props.model.append(newFileObj)
      .then(() => {
        newFileObj.sendFile(file);
      });
    }

    this.setState({ fileDrop: false });
  };

  onDragLeave = (event: React.DragEvent<any>) => {
    if (event.relatedTarget == null)
      this.setState({ fileDrop: false });
  };

  renderFileDrop() {
    if (!this.state.fileDrop)
      return null;

    return (
      <div
        ref={this.dropTgt}
        onDrop={this.onDrop}
        onDragOver={evt => evt.preventDefault()}
        style={{
        zIndex: 1000,
        position: 'absolute',
        left: 0,
        top: 0,
        right: 0,
        bottom: 0,
        opacity: 0.5,
        backgroundColor: 'white'
      }}>
        files drop
      </div>
    );
  }

  render() {
    return (
      <div
        className={classes.docContView}
        onDragEnter={this.onDragEnter}
        onDragLeave={this.onDragLeave}
      >
        {this.renderFileDrop()}
        {this.renderItems()}
        {this.renderDoc()}
      </div>
    );
  }
}
