import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Dialog, FormGroup, Button, Intent, Classes as cs } from '@blueprintjs/core';
import { cn } from '../common/common';

export interface LoginResult {
  login: string;
  pass: string;
}

export interface LoginArgs extends LoginResult {
  error?: string;
}

interface Props {
  error?: string;
  onLogin?: (args: LoginArgs) => void;
}

interface State {
  show?: boolean;
}

class LoginDialog extends React.Component<Props, State> {
  private login: HTMLInputElement;
  private pass: HTMLInputElement;

  private onLoginRef = el => this.login = el;
  private onPassRef = el => this.pass = el;

  constructor(props) {
    super(props);

    this.state = {
      show: true
    };
  }

  private onLogin = () => {
    const { onLogin } = this.props;
    onLogin && onLogin({ login: this.login.value, pass: this.pass.value});
    this.setState({show: false});
  }

  showError(): JSX.Element {
    if (!this.props.error)
      return null;

    return (
      <div className={cn(cs.CALLOUT, cs.INTENT_DANGER)}>
        <h4>Login failed</h4>
        {this.props.error}
      </div>
    );
  }

  render() {
    return (
      <Dialog isOpen={this.state.show} isCloseButtonShown={false} title='Authorization'>
        <div className={cs.DIALOG_BODY}>
          {this.showError()}
          <FormGroup label='Login:' labelFor='login'>
            <input
              ref={this.onLoginRef}
              id='login'
              placeholder='Login'
              className={cn(cs.INPUT, cs.LARGE, cs.FILL)}
            />
          </FormGroup>
          <FormGroup label='Password:' labelFor='passwd'>
            <input
              ref={this.onPassRef}
              id='passwd'
              placeholder='Password'
              className={cn(cs.INPUT, cs.LARGE, cs.FILL)}
            />
          </FormGroup>
        </div>
        <div className={cs.DIALOG_FOOTER}>
          <div className={cs.DIALOG_FOOTER_ACTIONS}>
            <Button text='OK' intent={Intent.PRIMARY} onClick={this.onLogin}/>
            <Button text='Cancel'/>
          </div>
        </div>
      </Dialog>
    );
  }
}

let cont: HTMLDivElement;
export function showLogin(error?: string): Promise<LoginResult> {
  if (cont)
    ReactDOM.unmountComponentAtNode(cont);

  if (cont && cont.parentNode == document.body)
    document.body.removeChild(cont);

  if (!cont)
    cont = document.createElement('div');

  document.body.appendChild(cont);

  return new Promise((resolve, reject) => {
    ReactDOM.render(<LoginDialog onLogin={resolve} error={error}/>, cont);
  });
}
