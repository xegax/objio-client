import * as React from 'react';
import { DataSourceHolder } from '../../model/server/doc-layout';
import './layout-cont-view.scss';

const classes = {
  cont: 'layout-cont',
  title: 'layout-cont-title',
  titleWrap: 'layout-cont-titlewrap',
  header: 'layout-cont-header'
};

interface Owner {
  onRemove?();
  onEdit?();
  setName?(name: string);
  isEdit?(): boolean;
}

interface Props {
  model: DataSourceHolder;
  owner?: Owner;
}

export class LayoutContView extends React.Component<Props> {
  subscriber = () => {
    this.setState({});
  }

  componentDidMount() {
    this.props.model.holder.subscribe(this.subscriber);
  }

  componentWillUnmount() {
    this.props.model.holder.unsubscribe(this.subscriber);
  }

  renderTitle(): JSX.Element {
    const model = this.props.model;
    const owner = this.props.owner;
    let title: JSX.Element;
    if (owner && owner.isEdit && owner.isEdit()) {
      title = (
        <input
          defaultValue={model.getName()}
          onKeyDown={evt => {
            if (evt.keyCode == 13)
              owner.setName(evt.currentTarget.value);
          }}
        />
      );
    } else {
      title = (
        <div className={classes.titleWrap}
          onDoubleClick={() => {
            owner.onEdit();
          }}
        >
          {model.getName()}
        </div>
      );
    }

    return (
      <div className={classes.title}>
        {title}
      </div>
    );
  }

  render() {
    const obj = this.props.model;
    const owner = this.props.owner;
    return (
      <div className={classes.cont}>
        <div className={classes.header}>
          {this.renderTitle()}
          <div style={{flexGrow: 0}}>
            <i
              onClick={() => {
                obj.toggleEdit();
              }}
              style={{cursor: 'pointer', backgroundColor: obj.isEdit() ? 'gray' : null }}
              className={'fa fa-edit'}
            />
            {owner && owner.onRemove && <i
              onClick={owner.onRemove}
              style={{cursor: 'pointer'}}
              className='fa fa-remove'
            />}
          </div>
        </div>
        {this.props.children}
      </div>
    );
  }
}
