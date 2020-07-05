import { createRequestor } from 'objio';
import 'ts-react-ui/_base.scss';
import '../../styles/styles.scss';

console.log('test.ts');

const req = createRequestor();
req.getJSON({ url: 'http://localhost:8000/node/cfg', params: { promise: 1 }, postData: { xxx: 'yyy' } })
.then(data => {
  console.log(data);
}).catch(err => {
  console.log(err);
});

