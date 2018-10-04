import * as React from 'react';
import { Dialog, Classes as cs, Button, Intent } from '@blueprintjs/core';
import { showModal } from 'ts-react-ui/show-modal';

export abstract class WizardContent<P = {}, S = {}> extends React.Component<P, S> {
  abstract getResult(): Object;
  abstract render(): React.ReactNode;
}

interface Props {
  close?: (ok: boolean, args: Object) => void;
}

export class Wizard extends React.Component<Props, {}> {
  private content: WizardContent;
  private onRef = e => {
    this.content = e;
  };

  render() {
    const { close, children } = this.props;
    return (
      <Dialog isOpen={true}>
        <div className={cs.DIALOG_BODY}>
          {React.cloneElement(React.Children.only(children), {ref: this.onRef})}
        </div>
        <div className={cs.DIALOG_FOOTER}>
          <div className={cs.DIALOG_FOOTER_ACTIONS}>
            <Button
              text='OK'
              intent={Intent.PRIMARY}
              onClick={() => {
                close(true, this.content.getResult());
              }}/>
            <Button
              text='Cancel'
              onClick={() => {
                close(false, null);
              }}
            />
          </div>
        </div>
      </Dialog>
    );
  }
}

export function showWizard<T>(content: JSX.Element): Promise<T> {
  return new Promise((resolve, reject) => {
    const modal = showModal(
      <Wizard close={(ok, args) => {
          if (ok) {
            resolve(args as T);
          } else {
            reject();
          }
          modal.close();
        }}>
        {content}
      </Wizard>
    );
  });
}
