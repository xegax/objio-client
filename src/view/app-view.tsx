import * as React from 'react';
import { AppCompLayout, AppComponent, AppContent } from 'ts-react-ui/app-comp-layout';
import { ListView, Item } from 'ts-react-ui/list-view';
import { App, getObjectBase } from '../model/client/app';
import { OBJIOItem } from 'objio';
import { PropSheet, PropsGroup, PropItem, TextPropItem, DropDownPropItem } from 'ts-react-ui/prop-sheet';
import { ObjectBase } from 'objio-object/base/object-base';
import { FileObjectBase as FileObject } from 'objio-object/base/file-object';
import { DocHolder } from '../model/server/doc-holder';
import { createDocWizard } from './create-doc-wizard';
import { ViewFactory } from 'objio-object/common/view-factory';
import { FilesDropContainer } from 'ts-react-ui/files-drop-container';
import './_app.scss';

export { App };

interface Props {
  model: App;
  vf: ViewFactory;
  renderContent(obj: OBJIOItem): JSX.Element;
}

interface State {
  listHeight: number;
}

export class AppView extends React.Component<Props, State> {
  state: Readonly<State> = { listHeight: 200 };

  subscriber = () => {
    this.setState({});
  }

  componentDidMount() {
    this.props.model.updateObjList(true);
    this.props.model.holder.subscribe(this.subscriber);
  }

  componentWillUnmount() {
    this.props.model.holder.unsubscribe(this.subscriber);
  }

  onSelect = (item: Item) => {
    const objects = this.props.model.getObjects();
    const select = objects.find(obj => obj.value == item.value);
    this.props.model.setSelect(select ? select.object : null);
  }
  
  onDropToList = (files: Array<File>) => {
    this.props.model.appendToUpload({ files });
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

  renderUploadQueue() {
    const uploadQueue = this.props.model.getUploadQueue();
    if (!uploadQueue.length)
      return null;

    const perc = Math.round( this.props.model.getCurrFileProgress() * 100 ) + '%';
    return (
      <PropsGroup
        itemWrap={false}
        defaultHeight={200}
        label={`uploading ${uploadQueue.length} files`}
        faIcon='fa fa-spinner fa-spin'
      >
        <ListView
          values={uploadQueue.map((file, i) => {
            return {
              value: file.file.name,
              render: i == 0 ? () => {
                return (
                  <div>
                    <div style={{ width: perc, backgroundColor: 'lightgreen' }}>{file.file.name}</div>
                  </div>
                )
              } : null
            };
          })}
        />
      </PropsGroup>
    );
  }

  renderSelectObjectInfo() {
    const select = this.props.model.getSelect();

    const objBase: ObjectBase = getObjectBase(select);
    const file: FileObject = select instanceof FileObject ? select : null;
    return (
      <PropSheet>
        <FilesDropContainer onDropFiles={this.onDropToList}>
          <PropsGroup label='object list' itemWrap={false} defaultHeight={200} className='object-list-group'>
            <ListView
              value={select ? {value: objBase.holder.getID()} : null}
              values={this.props.model.getObjects()}
              onSelect={this.onSelect}
            />
          </PropsGroup>
        </FilesDropContainer>
        {this.renderUploadQueue()}
        {select && <PropsGroup label='object' defaultOpen={false}>
          <PropItem label='id' value={select.holder.getID()}/>
          <PropItem label='version' value={select.holder.getVersion()}/>
          {objBase && <TextPropItem label='name' value={objBase.getName()} onEnter={value => objBase.setName(value)}/>}
          {file && <PropItem label='size' value={file.getSize()}/>}
          {file && <PropItem label='original name' value={file.getOriginName()}/>}
          {file && <PropItem label='ext' value={file.getExt()}/>}
        </PropsGroup>}
        {select && objBase.getObjPropGroups()}
      </PropSheet>
    );
  }

  renderSelectObjectComponents() {
    const select = this.props.model.getSelect() as FileObject | DocHolder;
    if (!select)
      return null;

    if (select instanceof DocHolder)
      return select.getDoc().getAppComponents();

    return select.getAppComponents();
  }

  onAdd = () => {
    createDocWizard(this.props.model, this.props.vf)
    .catch(() => {
      console.log('create cancel');
    });
    return false;
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

  renderDoc(select: FileObject | DocHolder) {
    if (!select)
      return null;

    return (
      <FilesDropContainer onDropFiles={this.onDropToDoc} onStartDrag={this.onDragToDoc}>
        {this.props.renderContent(select)}
      </FilesDropContainer>
    );
  }

  render() {
    const select = this.props.model.getSelect();
    return (
      <AppCompLayout defaultSelect='explorer'>
        <AppComponent id='add' onSelect={this.onAdd} faIcon='fa fa-plus'/>
        <AppComponent id='explorer' faIcon='fa fa-search' style={{ width: '100%', display: 'flex' }}>
          {this.renderSelectObjectInfo()}
        </AppComponent>
        {this.renderSelectObjectComponents()}
        <AppContent>
          {this.renderDoc(select)}
        </AppContent>
      </AppCompLayout>
    );
  }
}
