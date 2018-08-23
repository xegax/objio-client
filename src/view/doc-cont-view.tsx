import * as React from 'react';
import {DocHolder} from '../model/client/doc-holder';
import {
  DocContainer,
  DocTreeItem
} from '../model/client/doc-container';
import { DocSpriteSheet } from '../model/doc-sprite-sheet';
import { Menu, ContextMenu, MenuItem } from '@blueprintjs/core';
import { DocTable } from '../model/client/doc-table';
import { OBJIOItemClass, OBJIOItem } from 'objio';
import { createFileObject } from 'objio-object';
import { FileArgs } from 'objio-object/file-object';
import { Tree } from 'ts-react-ui/tree';
import { showWizard } from '../view/wizard';
import { FitToParent } from 'ts-react-ui/fittoparent';
import { DocLayout } from '../model/client/doc-layout';
import { Draggable } from 'ts-react-ui/drag-and-drop';
import { DocVideo } from '../model/client/doc-video';

import './doc-cont-view.scss';
import { VideoFileObject } from 'objio-object/video-file-object';

const classes = {
  docContView: 'doc-cont-view',
  docList: 'doc-list',
  docContent: 'doc-content',
  listItem: 'doc-list-item',
  listItemSelect: 'doc-list-item-select'
};

interface Props {
  model: DocContainer;
  getView: (doc: DocHolder) => JSX.Element;
  createObject: (objClass: OBJIOItemClass) => DocHolder;
  getWizard: (objClass: OBJIOItemClass) => JSX.Element;
}

interface State {
  fileDrop?: boolean;
}

export class DocContView extends React.Component<Props, State> {
  private subscriber = () => {
    this.setState({});
  };

  private dropTgt: React.Ref<HTMLDivElement> = React.createRef<HTMLDivElement>();

  constructor(props: Props) {
    super(props);

    this.state = {};
  }

  componentDidMount() {
    this.props.model.holder.subscribe(this.subscriber);
  }

  componentWillUnmount() {
    this.props.model.holder.unsubscribe(this.subscriber);
  }

  createObject(objClass: OBJIOItemClass): Promise<OBJIOItem> {
    const obj = this.props.createObject(objClass);
    return (
      this.append(obj)
      .then(() => {
        const wzrd = this.props.getWizard(objClass);
        if (wzrd)
          showWizard(wzrd).then(args => obj.execute(args));

        return obj;
      })
    );
  }

  showWizard(objClass: OBJIOItemClass): JSX.Element {
    return this.props.getWizard(objClass);
  }

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

  append = (doc: DocHolder) => {
    return this.props.model.append(doc)
    .then(() => {
      this.props.model.setSelect(doc);
    });
  }

  renderTreeItem = (item: DocTreeItem, jsx: JSX.Element): JSX.Element => {
    if (!item.doc)
      return jsx;
    return <Draggable data={{id: item.doc.holder.getID()}}>{jsx}</Draggable>;
  }

  renderItems() {
    return (
      <div
        key='doc-list' className={classes.docList}
        style={{display: 'flex'}}
        onContextMenu={e => this.onContextMenu(e)}
      >
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
    let fileObj = createFileObject(fileArgs);
    let doc: DocHolder;
    if (fileObj instanceof VideoFileObject) {
      doc = new DocHolder({doc: new DocVideo(fileObj as VideoFileObject)});
    } else {
      doc = new DocHolder({ doc: fileObj, name: file.name });
    }

    this.props.model.append(doc).then(() => {
      this.props.model.setSelect(doc);
      fileObj.sendFile(file);
    });

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
