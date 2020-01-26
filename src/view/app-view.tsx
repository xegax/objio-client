import * as React from 'react';
import { AppCompLayout, AppComponent, AppContent } from 'ts-react-ui/app-comp-layout';
import { ListView } from 'ts-react-ui/list-view';
import { App, ObjTypeMap, TreeItemExt } from '../model/client/app';
import { OBJIOItem } from 'objio';
import { PropSheet, PropsGroup, PropItem, TextPropItem } from 'ts-react-ui/prop-sheet';
import { ObjectBase, ObjProps } from 'objio-object/base/object-base';
import { FilesDropContainer } from 'ts-react-ui/files-drop-container';
import './_app.scss';
import { Tree, DragAndDrop } from 'ts-react-ui/tree/tree';
import { getPath } from 'ts-react-ui/tree/item-helpers';
import { DocView } from './doc-view';
import { Progress } from 'ts-react-ui/progress';
export { App, ObjTypeMap };

interface Props {
  model: App;
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

  onSelect = (path: Array<Array<TreeItemExt>>) => {
    const arr = path[0];
    const item = arr[arr.length - 1];
    if (!item.folder) {
      App.setSelectByObj(item.value);
    } else {
      App.setSelectByPath(arr.map(item => item.value).join('-'));
    }
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

  private onDragAndDrop = (args: DragAndDrop) => {
    const srcFolder = args.drag.map((item: TreeItemExt) => item.folder ? item : null).filter(v => v) as Array<TreeItemExt>;
    const objIds = args.drag.map((item: TreeItemExt) => !item.folder ? item.value : null).filter(v => v);
    const path = getPath(args.drop as TreeItemExt).map(item => item.value).slice(1);  // remove 'root' from path

    if (srcFolder.length) {
      this.props.model.moveFolder({ src: getPath(srcFolder[0]).map(item => item.value).slice(1), dst: path });
    } else if (objIds.length) {
      this.props.model.moveObjsToFolder({
        objIds,
        path
      });
    }
  };

  renderSelectObjectInfo() {
    const select = this.props.model.getSelect();

    const objBase: ObjectBase = select;
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
              onDragAndDrop={this.onDragAndDrop}
            />
          </PropsGroup>
        </FilesDropContainer>
        {this.renderUploadQueue()}
        {select && (
          <PropsGroup
            label='Object'
            defaultOpen={false}
          >
            <PropItem
              label='ID'
              value={select.getID()}
            />
            <PropItem
              label='Version'
              value={select.getVersion()}
            />
            {objBase && (
              <TextPropItem
                label='Name'
                value={objBase.getName()}
                onEnter={value => objBase.setName(value)}
              />
            )}
          </PropsGroup>
        )}
        {select && objBase.getObjPropGroups( this.getObjProps() )}
      </PropSheet>
    );
  }

  getObjProps(): ObjProps {
    return {
      objects: this.props.model.filterObjects,
      append: obj => this.props.model.append( obj )
    };
  }

  private renderSelectObjectComponents() {
    const select = this.props.model.getSelect();
    if (!select)
      return null;

    const arr = select.getAppComponents();
    arr.push(...select.getObjTabs().map((tab, i) => {
      const key = 'tab-' + i;
      return (
        <AppComponent
          key={key}
          id={tab.id || key}
          faIcon={tab.icon}
          title={tab.title}
          style={{ width: '100%', display: 'flex', flexDirection: 'column' }}
        >
          <PropSheet fitToAbs>
            {tab.render(this.getObjProps())}
          </PropSheet>
        </AppComponent>
      );
    }));

    return arr;
  }

  onAdd = () => {
    this.props.model.createObject();
    return false;
  }

  onDragToDoc = (files: Array<File>): boolean => {
    const select = this.props.model.getSelect();
    return select && select.getFS() != null;
  }

  onDropToDoc = (files: Array<File>) => {
    const dst = this.props.model.getSelect();
    this.props.model.appendToUpload({ files, dstObj: dst });
  }

  renderDoc(select: ObjectBase) {
    if (this.props.model.isObjLoading()) {
      return (
       <Progress/>
     );
   }

    if (!select)
      return null;

    return (
      <FilesDropContainer
        onDropFiles={this.onDropToDoc}
        onStartDrag={this.onDragToDoc}
      >
        <DocView model={select} root={this.props.model}>
          {this.props.renderContent(select)}
        </DocView>
      </FilesDropContainer>
    );
  }

  render() {
    const select = this.props.model.getSelect();
    return (
      <AppCompLayout
        defaultSelect='explorer'
        className='abs-fit'
      >
        <AppComponent
          id='add'
          title='Create object ...'
          onSelect={this.onAdd}
          faIcon='fa fa-plus'
        />
        <AppComponent
          id='explorer'
          title='Explorer'
          faIcon='fa fa-search'
          style={{ width: '100%', display: 'flex' }}
        >
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
