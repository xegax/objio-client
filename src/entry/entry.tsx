import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Dialog } from '@blueprintjs/core';

let cont = document.createElement('div');
document.body.appendChild(cont);

ReactDOM.render(<Dialog isOpen title='header'/>, cont);