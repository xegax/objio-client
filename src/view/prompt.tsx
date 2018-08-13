import * as React from 'react';
import { showModal } from './show-modal';
import { Dialog, FormGroup, Button, Intent, Classes as cs } from '@blueprintjs/core';
import { cn } from '../common/common';

export interface PromptArgs {
  title?: string;
  prompt?: string;
  placeholder?: string;
}

interface Props extends PromptArgs {
  onOk(value: string);
  onCancel();
}

export class Prompt extends React.Component<Props, {}> {
  private input: React.RefObject<HTMLInputElement> = React.createRef();

  onOk = () => {
    this.props.onOk(this.input.current.value);
  };

  onCancel = () => {
    this.props.onCancel();
  };

  render() {
    return (
      <Dialog isOpen isCloseButtonShown={false} title={this.props.title}>
        <div className={cs.DIALOG_BODY}>
          <FormGroup label={this.props.prompt} labelFor='prompt'>
            <input
              ref={this.input}
              id='prompt'
              placeholder={this.props.placeholder}
              className={cn(cs.INPUT, cs.LARGE, cs.FILL)}
            />
          </FormGroup>
        </div>
        <div className={cs.DIALOG_FOOTER}>
          <div className={cs.DIALOG_FOOTER_ACTIONS}>
            <Button text='OK' intent={Intent.PRIMARY} onClick={this.onOk}/>
            <Button text='Cancel' onClick={this.onCancel}/>
          </div>
        </div>
      </Dialog>
    );
  }
}

export function prompt(args: PromptArgs): Promise<string> {
  return new Promise((resolve, reject) => {
    const onOk = (text: string) => {
      dlg.close();
      resolve(text);
    };

    const onCancel = () => {
      dlg.close();
      reject();
    };

    const dlg = showModal(<Prompt {...args} onOk={onOk} onCancel={onCancel}/>);
  });
}

export interface SelectArgs extends PromptArgs {
  items: Array<string>;
}

interface SelectProps extends Props {
  items: Array<string>;
}

export class Select extends React.Component<SelectProps, {}> {
  private input: React.RefObject<HTMLSelectElement> = React.createRef();

  onOk = () => {
    this.props.onOk(this.input.current.value);
  };

  onCancel = () => {
    this.props.onCancel();
  };

  render() {
    return (
      <Dialog isOpen isCloseButtonShown={false} title={this.props.title}>
        <div className={cs.DIALOG_BODY}>
          <FormGroup label={this.props.prompt} labelFor='prompt'>
            <select
              ref={this.input}
              id='prompt'
              placeholder={this.props.placeholder}
              className={cn(cs.SELECT, cs.LARGE, cs.FILL)}
            >
              {this.props.items.map((item, i) => {
                return <option key={i} value={item}>{item}</option>
              })}
            </select>
          </FormGroup>
        </div>
        <div className={cs.DIALOG_FOOTER}>
          <div className={cs.DIALOG_FOOTER_ACTIONS}>
            <Button text='OK' intent={Intent.PRIMARY} onClick={this.onOk}/>
            <Button text='Cancel' onClick={this.onCancel}/>
          </div>
        </div>
      </Dialog>
    );
  }
}

export function select(args: SelectArgs) {
  return new Promise((resolve, reject) => {
    const onOk = (text: string) => {
      dlg.close();
      resolve(text);
    };

    const onCancel = () => {
      dlg.close();
      reject();
    };

    const dlg = showModal(<Select {...args} onOk={onOk} onCancel={onCancel}/>);
  });
}