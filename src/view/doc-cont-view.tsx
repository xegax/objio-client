import * as React from 'react';
import {DocHolder} from '../model/doc-holder';
import {
  DocContainer,
  DocDummy,
  DocSpriteSheet
} from '../model/doc-container';
import { cn } from '../common/common';
import { Menu, ContextMenu, MenuItem } from '@blueprintjs/core';
import { DocProcess } from '../model/doc-process';
import { DocTable } from '../model/client/doc-table';
import { OBJIOItemClass, OBJIOItem } from 'objio';
import { FileObject, FileArgs } from 'objio-object/file-object';
import { Tree } from 'ts-react-ui/tree';
import { showWizard } from '../view/wizard';
import { FitToParent } from 'ts-react-ui/fittoparent';

const classes = {
  docContView: 'doc-cont-view',
  docList: 'doc-list',
  docContent: 'doc-content',
  listItem: 'doc-list-item',
  listItemSelect: 'doc-list-item-select'
};

interface Props {
  model: DocContainer;
  getView: (doc: OBJIOItem) => JSX.Element;
  createObject: (objClass: OBJIOItemClass) => DocHolder;
  getWizard: (objClass: OBJIOItemClass) => JSX.Element;
}

interface State {
  select?: DocHolder;
  fileDrop?: boolean;
}

export class DocContView extends React.Component<Props, State> {
  private subscriber = () => {
    const tree = this.props.model.getTree();
    this.setState({select: tree.getSelect().doc});
  };

  private dropTgt: React.Ref<HTMLDivElement> = React.createRef<HTMLDivElement>();

  constructor(props: Props) {
    super(props);

    this.state = {};
  }

  componentDidMount() {
    const tree = this.props.model.getTree();
    this.props.model.holder.subscribe(this.subscriber);
    tree.subscribe(() => {
      this.setState({select: tree.getSelect().doc});
    }, 'select');
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

  onContextMenu = (e: React.MouseEvent<any>, idx: number) => {
    e.preventDefault();
    e.stopPropagation();

    const items = [
      <MenuItem key='append' text='append'>
        <MenuItem text='dummy' onClick={() => this.createObject(DocDummy)}/>
        <MenuItem text='sprite' onClick={() => this.createObject(DocSpriteSheet)}/>
        <MenuItem text='process' onClick={() => this.createObject(DocProcess)}/>
        <MenuItem text='table' onClick={() => this.createObject(DocTable)}/>
      </MenuItem>,
      <MenuItem key='delete' text='delete' onClick={() => {
        this.props.model.remove(this.props.model.getTree().getSelect());
      }}/>
    ];

    ContextMenu.show(<Menu>{items}</Menu>, {left: e.clientX, top: e.clientY});
  }

  append = (doc: DocHolder) => {
    return this.props.model.append(doc)
    .then(() => {
      this.setState({select: doc});
    });
  }

  renderItems() {
    return (
      <div
        key='doc-list' className={classes.docList}
        style={{display: 'flex'}}
        onContextMenu={e => this.onContextMenu(e, -1)}
      >
        <FitToParent wrapToFlex>
          <Tree model={this.props.model.getTree()}/>
        </FitToParent>
      </div>
    );
  }

  renderDoc() {
    const doc = this.state.select;
    const view = doc ? this.props.getView(doc.getDoc()) : null;
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
      originName: file.name,
      originSize: file.size,
      mime: file.type
    };
    const fileObj = new FileObject(fileArgs);
    const doc = new DocHolder({ doc: fileObj });

    this.props.model.append(doc).then(() => {
      this.setState({ select: doc });
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
