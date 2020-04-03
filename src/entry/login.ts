import { showLogin } from 'ts-react-ui/forms/login';
import { User } from 'objio/base/user';
import { createRequestor } from 'objio';
import { parseParams, getURL } from '../common/common';
import 'ts-react-ui/_base.scss';
import '../../styles/styles.scss';

let req = createRequestor({ urlBase: '/handler' });
showLogin({
  login: res => User.openSession({ req, login: res.login, pass: res.pass })
}).then(() => {
  const { params, hash } = parseParams();
  const url = getURL('/', { params, hash });
  location.assign(url);
});