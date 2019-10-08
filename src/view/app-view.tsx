import * as React from 'react';
import { AppCompLayout, AppComponent, AppContent } from 'ts-react-ui/app-comp-layout';
import { ListView, Item } from 'ts-react-ui/list-view';
import { App, ObjTypeMap } from '../model/client/app';
import { OBJIOItem } from 'objio';
import { PropSheet, PropsGroup, PropItem, TextPropItem } from 'ts-react-ui/prop-sheet';
import { ObjectBase, ObjProps } from 'objio-object/base/object-base';
import { FileObjectBase as FileObject } from 'objio-object/base/file-object';
import { DocHolder } from '../model/client/doc-holder';
import { createDocWizard } from './create-doc-wizard';
import { FilesDropContainer } from 'ts-react-ui/files-drop-container';
import { ObjectToCreate } from 'objio-object/common/interfaces';
import './_app.scss';
import { Tree, TreeItem } from 'ts-react-ui/tree/tree';

export { App, ObjTypeMap };

interface Props {
  model: App;
  objects: Array<ObjectToCreate>;
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
    this.props.model.holder.subscribe(this.subscriber);
  }

  componentWillUnmount() {
    this.props.model.holder.unsubscribe(this.subscriber);
  }

  onSelect = (path: Array<TreeItem>) => {
    App.setSelectById(path.map(p => p.value).join(','));
    /*const objects = this.props.model.getObjectsToRender();

    if (!item.parent) {
      const select = objects.find(obj => obj.value == item.value);
      App.setSelectById(select ? select.object.getID() : null);
    } else {
      const select = objects.find(obj => obj.value == item.parent);
      App.setSelectById([ item.parent ]);
    }*/
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
        // faIcon='fa fa-spinner fa-spin'
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

    const objBase: ObjectBase = select;
    const file: FileObject = select instanceof FileObject ? select : null;
    return (
      <PropSheet fitToAbs>
        <FilesDropContainer onDropFiles={this.onDropToList}>
          <PropsGroup
            label='Objects'
            defaultHeight={200}
            padding={false}
          >
            <Tree
              style={{ flexGrow: 1 }}
              select={this.props.model.getSelectPath()}
              values={this.props.model.getObjTree()}
              onSelect={this.onSelect}
            />
          </PropsGroup>
        </FilesDropContainer>
        {this.renderUploadQueue()}
        {select && <PropsGroup label='Object' defaultOpen={false}>
          <PropItem label='id' value={select.getID()}/>
          <PropItem label='version' value={select.getVersion()}/>
          {objBase && <TextPropItem label='name' value={objBase.getName()} onEnter={value => objBase.setName(value)}/>}
          {file && <PropItem label='size' value={file.getSize()}/>}
          {file && <PropItem label='original name' value={file.getOriginName()}/>}
          {file && <PropItem label='ext' value={file.getExt()}/>}
        </PropsGroup>}
        {select && objBase.getObjPropGroups( this.getObjProps() )}
      </PropSheet>
    );
  }

  getObjProps(): ObjProps {
    return {
      objects: this.props.model.filterObjects,
      append: obj => this.props.model.append(new DocHolder({ doc: obj }))
    };
  }

  renderSelectObjectComponents() {
    const select = this.props.model.getSelect();
    if (!select)
      return null;

    const arr = select.getAppComponents();
    arr.push(...select.getObjTabs().map((tab, i) => {
      const key = 'tab-' + i;
      return (
        <AppComponent key={key} id={key} faIcon={tab.icon} style={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
          <PropSheet fitToAbs>
            {tab.render(this.getObjProps())}
          </PropSheet>
        </AppComponent>
      );
    }));

    return arr;
  }

  onAdd = () => {
    createDocWizard(this.props.objects)
    .then(obj => {
      this.props.model.append( new DocHolder({ doc: obj }) );
    })
    .catch(() => {
      console.log('create cancel');
    });
    return false;
  }

  onDragToDoc = (files: Array<File>): boolean => {
    const select = this.props.model.getSelect();
    return select && select.sendFile != null;
  }

  onDropToDoc = (files: Array<File>) => {
    const dst = this.props.model.getSelect();
    this.props.model.appendToUpload({ files, dstObj: dst });
  }

  renderDoc(select: ObjectBase) {
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
      <AppCompLayout defaultSelect='explorer' className='abs-fit'>
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
