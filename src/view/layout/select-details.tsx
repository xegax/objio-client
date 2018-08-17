import * as React from 'react';
import { SelectDetails } from '../../model/client/layout/select-details';

import './_select-details.scss';
import { FieldItem } from '../../model/server/layout/select-details';

export { SelectDetails };

const classes = {
  class: 'select-details',
  name: 'select-details-name',
  value: 'select-details-value',
  field: 'select-details-field',
  content: 'select-details-content',
  select: 'select-details-select'
};

interface Props {
  model: SelectDetails;
}

interface State {
  edit?: FieldItem;
}

export class SelectDetailsView extends React.Component<Props, State> {
  state: Readonly<State> = {};

  subscriber = () => {
    this.setState({});
  }

  componentDidMount() {
    this.props.model.holder.subscribe(this.subscriber);
  }

  componentWillUnmount() {
    this.props.model.holder.unsubscribe(this.subscriber);
  }

  renderIdColumnSelect(): JSX.Element {
    const model = this.props.model;
    if (!model.isEdit())
      return;

    const value = model.getIdColumn();
    return (
      <div className={classes.select}>id column: 
        <select
          style={{flexGrow: 1}}
          value={value}
          onChange={e => {
            model.setIdColumn(e.currentTarget.value);
          }}
        >
          {model.getColumns().map((col, i) => {
            return <option key={i} value={col.name}>{col.name}</option>;
          })}
        </select>
      </div>
    );
  }

  renderName(item: FieldItem): JSX.Element {
    if (this.state.edit == item)
      return (
        <input
          defaultValue={item.label || item.name}
          onKeyDown={evt => {
            if (evt.keyCode == 13) {
              item.label = evt.currentTarget.value;
              this.setState({edit: null});
              this.props.model.save(item);
            }
          }}
        />
      );

    return (
      <span
        onDoubleClick={() => {
          this.setState({ edit: item });
        }}
        className={classes.name}
      >
        {item.label || item.name}
      </span>
    );
  }

  renderData(): JSX.Element {
    const model = this.props.model;
    const state = model.get().getState();
    if (!state.isValid()) {
      return <React.Fragment>in progress: {state.getProgress()}</React.Fragment>;
    }

    const fields = model.getFields();
    let content: JSX.Element;
    if (!fields) {
      content = (
        <div style={{display: 'flex'}}>
          nothing selected
        </div>
      );
    } else {
      const edit = model.isEdit();
      content = (
        <div className={classes.content}>
        {
          fields.filter(item => edit || item.discard == null || !item.discard).map((item, i) => {
            if (!edit && item.image)
              return (
                <div style={{
                    margin: 5,
                    backgroundColor: 'silver',
                    height: 200,
                    backgroundPosition: 'center',
                    backgroundSize: 'contain',
                    backgroundRepeat: 'no-repeat',
                    backgroundImage: `url(${(item.label || '').replace(new RegExp('%1%', 'g'), item.value)})`
                  }}
                />
              );

            return (
              <div key={i} className={classes.field}>
                { edit ? <input type='checkbox' checked={!!item.discard} onChange={() => {
                  item.discard = !item.discard;
                  model.save(item);
                }}/> : null }
                { edit ? <input type='checkbox' checked={!!item.image} onChange={() => {
                  item.image = !item.image;
                  model.save(item);
                }}/> : null }
                {this.renderName(item)}:
                <span className={classes.value}>{item.value}</span>
              </div>
            );
          })
        }
        </div>
      );
    }

    return (
      <React.Fragment>
        {this.renderIdColumnSelect()}
        {content}
      </React.Fragment>
    );
  }

  render() {
    return (
      <div className={classes.class}>
        {this.renderData()}
      </div>
    );
  }
}
