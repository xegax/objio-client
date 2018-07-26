import * as React from 'react';
import * as ReactDOM from 'react-dom';

let cont: HTMLDivElement;
let list: Array<JSX.Element> = [];

interface Props {
  list: Array<JSX.Element>;
}

class Container extends React.Component<Props, {}> {
  render() {
    return <React.Fragment>{this.props.list}</React.Fragment>;
  }
}

export function showModal(jsx: JSX.Element) {
  if (!cont)
    cont = document.createElement('div');

  if (cont.parentElement != document.body)
    document.body.appendChild(cont);

  list.push(React.cloneElement(jsx, {key: jsx.key || 'dialog-' + list.length}));

  function render() {
    ReactDOM.render(<Container list={list}/>, cont);
  }

  render();

  return {
    close: () => {
      list.splice(list.indexOf(jsx), 1);
      render();
    }
  };
}
