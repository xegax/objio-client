import * as React from 'react';
import { DocTreeItem } from '../model/client/doc-root';
import { OBJIOItem } from 'objio';
import { Tree } from 'ts-react-ui/tree';
import { FitToParent } from 'ts-react-ui/fittoparent';
import { Draggable } from 'ts-react-ui/drag-and-drop';
import { DocRoot } from '../model/client/doc-root';
import './doc-root.scss';
import { createDocWizard } from './create-doc-wizard';
import { ViewFactory } from '../common/view-factory';
import { FilesDropContainer } from 'ts-react-ui/files-drop-container';
import { FileObject } from 'objio-object/client/file-object';
import { DocHolder } from '../model/server/doc-holder';

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

export class DocRootView extends React.Component<Props> {
  private subscriber = () => {
    this.setState({});
  };

  componentDidMount() {
    this.props.model.holder.subscribe(this.subscriber);
  }

  componentWillUnmount() {
    this.props.model.holder.unsubscribe(this.subscriber);
  }

  renderTreeItem = (item: DocTreeItem, jsx: JSX.Element): JSX.Element => {
    if (!item.obj)
      return jsx;

    const select = this.props.model.getSelect() == item.obj;
    const obj = item.obj instanceof DocHolder ? item.obj.getDoc() : item.obj;
    return (
      <Draggable data={{id: obj.holder.getID()}}>
        <span style={{ color: select ? 'red' : null }}>{jsx}</span>
      </Draggable>
    );
  }

  renderLoadingQueue() {
    const uploading = this.props.model.getUploadQueue();
    if (uploading.length == 0)
      return null;

    const perc = Math.round( this.props.model.getCurrFileProgress() * 100 ) + '%';
    const perc2 = Math.round((uploading.length / this.props.model.getTotalFilesToUpload()) * 100) + '%';
    return (
      <div style={{ flexGrow: 0, display: 'flex', position: 'relative', whiteSpace: 'nowrap' }}>
        <div style={{ width: perc, maxWidth: perc, backgroundColor: 'lightgreen', position: 'absolute', left: 0, top: 0, bottom: 0 }}></div>
        <div style={{ width: perc2, maxWidth: perc2, backgroundColor: 'lightblue', position: 'absolute', left: 0, bottom: 0, height: 5 }}></div>
        <div style={{ flexGrow: 1, position: 'relative', textAlign: 'center' }}>
        <i className='fa fa-spinner fa-spin'/> {uploading.length} files in queue
        </div>
      </div>
    );
  }

  renderItems() {
    return (
      <div
        key='doc-list'
        className={classes.docList}
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
        {this.renderLoadingQueue()}
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

  onDropToItems = (files: Array<File>) => {
    this.props.model.appendToUpload({ files });
  }

  onDragToDoc = (files: Array<File>): boolean => {
    const select = this.props.model.getSelect();
    const doc: OBJIOItem = select instanceof DocHolder ? select.getDoc() : null;
    const fileObj: FileObject = select instanceof FileObject ? select : null;
    return select && (fileObj && fileObj.sendFile != null || doc && 'sendFile' in doc);
  }

  onDropToDoc = (files: Array<File>) => {
    const select = this.props.model.getSelect();
    const doc: OBJIOItem = select instanceof DocHolder ? select.getDoc() : null;
    const fileObj: FileObject = select instanceof FileObject ? select : null;
    this.props.model.appendToUpload({ files, dst: fileObj || doc });
  }

  render() {
    return (
      <div className={classes.docContView}>
        <FilesDropContainer onDropFiles={this.onDropToItems}>
          {this.renderItems()}
        </FilesDropContainer>
        <FilesDropContainer onDropFiles={this.onDropToDoc} onStartDrag={this.onDragToDoc}>
          {this.renderDoc()}
        </FilesDropContainer>
      </div>
    );
  }
}

