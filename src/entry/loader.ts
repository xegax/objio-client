
const scriptSrc = document.currentScript!.getAttribute('src');
const scripts: Array<string> = JSON.parse(document.currentScript.getAttribute('scripts'));
const placeholder = document.currentScript!.parentElement;
let total = scripts.length;

let pholder = document.createElement('div');
pholder.style.left = '0px';
pholder.style.right = '0px';
pholder.style.top = '0px';
pholder.style.position = 'absolute';
pholder.innerHTML = '<div id="p1" style="position: absolute; left: 0px; width: 0px; top: 0px; bottom: 0px; background-color: lightgreen "></div><div id="text" style="position: relative; text-align: center; font-family: sans-serif; font-size: 10px"></div>';
const progress: HTMLDivElement = pholder.querySelector('#p1');
const text: HTMLDivElement = pholder.querySelector('#text');
document.body.appendChild(pholder);

function loadNext() {
  let url = scripts.splice(0, 1)[0];
  if (!url) {
    document.body.removeChild(pholder);
    return;
  }

  let req = new XMLHttpRequest();
  req.addEventListener('progress', event => {
    let modp = 0;
    if (event.lengthComputable) {
      modp = event.loaded / event.total;
    }

    const p = 1 - scripts.length / total;
    const totalp = Math.floor(p * 90) + modp * 10;
    progress.style.width = totalp + '%';
    text.innerText = url.split('?')[0] + ' ' + Math.floor(modp * 100) + '%';
  }, false);

  req.addEventListener('load', () => {
    var s = document.createElement('script');
    s.src = url;
    placeholder.appendChild(s);
    loadNext();
  }, false);

  req.open('GET', url);
  req.send();
}

loadNext();
