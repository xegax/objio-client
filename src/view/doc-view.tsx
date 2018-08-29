import * as React from 'react';
import { DocHolder } from '../model/client/doc-holder';
import './doc-view.scss';
import { FileObject } from 'objio-object/file-object';
import { ViewFactory } from '../common/view-factory';
import { DocRoot } from '../model/client/doc-root';
import { OBJIOItem } from 'objio';
import { createDocWizard } from './create-doc-wizard';

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

    if (this.state.edit)
      return (
        <input
          defaultValue={ model.getName() }
          onKeyDown={ evt => {
            if (evt.keyCode == 13) {
              model.setName(evt.currentTarget.value);
              this.setState({ edit: false });
            }
          }}
        />
      );

    return (
      <div className={classes.name} onDoubleClick={() => this.setState({edit: true})}>
        {model.getName()}
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

    let depends = this.props.vf.findBySource(OBJIOItem.getClass(this.props.model));
    const create = depends.length ? (
      <i
        style={{marginLeft: 10}}
        title='create'
        className='fa fa-plus'
        onClick={() => {
          createDocWizard(this.props.root, this.props.vf, this.props.model)
          .catch(e => {
            console.log('cancel');
          });
        }}
      />
    ) : null;

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
