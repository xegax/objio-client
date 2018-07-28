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
import { FileObject } from 'objio-object/file-object';
import { showWizard } from '../view/wizard';

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
  edit?: boolean;
  select?: number;
  fileDrop?: boolean;
}

export class DocContView extends React.Component<Props, State> {
  private subscriber = () => {
    this.setState({});
  };

  private dropTgt: React.Ref<HTMLDivElement> = React.createRef<HTMLDivElement>();

  private input: HTMLInputElement;
  private onInputRef = e => {
    this.input = e;
    this.input && this.input.focus();
  };

  constructor(props: Props) {
    super(props);

    this.state = {};
  }

  componentDidMount() {
    this.props.model.getPublisher().subscribe(this.subscriber);
  }

  componentWillUnmount() {
    this.props.model.getPublisher().unsubscribe(this.subscriber);
  }

  renderItemName(doc: DocHolder, idx: number) {
    if (!this.state.edit || this.state.select != idx)
      return doc.getName();

    return (
      <input
        defaultValue={doc.getName()}
        ref={this.onInputRef}
        onBlur={this.finishEdit}
        onKeyDown={e => {
          if (e.keyCode == 13)
            this.finishEdit();
        }}
      />
    );
  }

  startEdit = (select: number) => {
    this.setState({ select, edit: true });
  }

  finishEdit = () => {
    if (!this.state.edit)
      return;

    const doc = this.props.model.getDoc(this.state.select);
    doc.setName(this.input.value).save();

    this.setState({ edit: false });
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
      </MenuItem>
    ];

    if (this.props.model.getDoc(idx)) {
      items.push(
        <MenuItem key='rename' text='rename' onClick={() => this.startEdit(idx)}/>,
        <MenuItem key='remove' text='remove' onClick={() => this.remove(idx)}/>
      );
    }

    ContextMenu.show(<Menu>{items}</Menu>, {left: e.clientX, top: e.clientY});
    this.setSelect(idx);
  }

  setSelect(select: number) {
    if (this.state.select == select)
      return;

    this.finishEdit();
    this.setState({ select });
  }

  renderItem(doc: DocHolder, idx: number) {
    const sel = idx == this.state.select;
    return (
      <div
        className={cn(classes.listItem, sel && classes.listItemSelect)}
        key={doc.getHolder().getID()}
        onClick={() => this.setSelect(idx)}
        onDoubleClick={() => this.startEdit(idx)}
        onContextMenu={e => this.onContextMenu(e, idx)}
      >
        { this.renderItemName(doc, idx) }
      </div>
    );
  }

  append = async (doc: DocHolder) => {
    await this.props.model.append(doc);
    this.setState({edit: true, select: this.props.model.getChildren().getLength() - 1});
  }

  remove = (idx: number) => {
    this.props.model.remove(idx);
  }

  renderItems() {
    const items = this.props.model.getChildren();
    const arr = [];
    for (let n = 0; n < items.getLength(); n++) {
      const doc = items.get(n);
      arr.push(this.renderItem(doc, n));
    }

    return (
      <div
        key='doc-list' className={classes.docList}
        onContextMenu={e => this.onContextMenu(e, -1)}
      >
        {arr}
      </div>
    );
  }

  renderDoc() {
    const doc = this.props.model.getDoc(this.state.select);
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
    const fileObj = new FileObject({
      originName: file.name,
      originSize: file.size,
      mime: file.type
    });
    const doc = new DocHolder({ doc: fileObj });

    this.props.model.append(doc).then(() => {
      this.setSelect(this.props.model.getChildren().getLength() - 1);
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
