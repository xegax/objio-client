import * as React from 'react';
import { DocHolder } from '../model/client/doc-holder';
import './doc-view.scss';
import { FileObject } from 'objio-object/client/file-object';
import { ViewFactory } from '../common/view-factory';
import { DocRoot } from '../model/client/doc-root';
import { OBJIOItem } from 'objio';
import { createDocWizard } from './create-doc-wizard';
import { ObjectBase } from 'objio-object/server/object-base';

const classes = {
  docView: 'doc-view',
  header: 'doc-view-header',
  content: 'doc-view-content',
  name: 'doc-view-header-name',
  tools: 'doc-view-header-tools'
};

interface Props {
  vf: ViewFactory;
  root: DocRoot;
  model: DocHolder | FileObject;
}

interface State {
  edit?: boolean;
}

export class DocView extends React.Component<Props> {
  state: Readonly<State> = { edit: false };

  subscriber = () => {
    this.setState({})
  };

  componentWillMount() {
    this.props.model.holder.subscribe(this.subscriber);
  }

  componentWillUnmount() {
    this.props.model.holder.unsubscribe(this.subscriber);
  }

  renderName(): JSX.Element {
    const model = this.props.model;
    let obj = model instanceof DocHolder ? model.getDoc() : model;

    if (this.state.edit)
      return (
        <input
          defaultValue={ obj.getName() }
          onKeyDown={ evt => {
            if (evt.keyCode == 13) {
              obj.setName(evt.currentTarget.value);
              this.props.root.updateTree();
              this.setState({ edit: false });
            }
          }}
        />
      );

    return (
      <div className={classes.name} onDoubleClick={() => this.setState({edit: true})}>
        {obj.getName()}
      </div>
    );
  }

  renderTools() {
    const remove = (
      <i
        style={{marginLeft: 10, marginRight: 10}}
        title='delete'
        className='fa fa-trash-o'
        onClick={() => this.props.root.remove(this.props.model)}
      />
    );

    const link = (
      <i
        style={{marginLeft: 10}}
        title='link'
        className='fa fa-link'
        onClick={() => location.assign(`/?objId=${this.props.model.holder.getID()}`)}
      />
    );

    // let depends = this.props.vf.findBySource(OBJIOItem.getClass(this.props.model));
    const create = null; /*depends.length ? (
      <i
        style={{marginLeft: 10}}
        title='create'
        className='fa fa-plus'
        onClick={() => {
          const model = this.props.model;
          const obj: ObjectBase | FileObject = model instanceof DocHolder ? model.getDoc() : model;
          createDocWizard(this.props.root, this.props.vf, obj)
          .catch(e => {
            console.log('cancel');
          });
        }}
      />
    ) : null;*/;

    return (
      <div className={classes.tools}>
        {create}
        {link}
        {remove}
      </div>
    );
  }

  render() {
    return (
      <div className={classes.docView}>
        <div className={classes.header}>
          {this.renderName()}
          {this.renderTools()}
        </div>
        <div className={classes.content}>
          {this.props.children}
        </div>
      </div>
    );
  }
}
