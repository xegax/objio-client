import * as React from 'react';
import { DocSpriteSheet, Animation, FrameInfo, DocSpriteSheetArgs } from '../model/doc-sprite-sheet';
import { WizardContent } from './wizard';
import { Rect, CSSRect, cssRectToRect, Point, rectToCSSRect } from '../common/point';
import { startDragging } from 'ts-react-ui/common/start-dragging';
import { isLeftDown } from 'ts-react-ui/common/event-helpers'
import { cn } from '../common/common';
import { Menu, ContextMenu, MenuItem, Tab, Tabs } from '@blueprintjs/core';
import { DocConfig } from './doc-config';

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(v, max));
}

const classes = {
  root: 'sprite-sheet-view',
  rect: 'rect',
  rectSelect: 'rect-select',
  corner: 'corner',
  ltCorner: 'lt-corner',
  rtCorner: 'rt-corner',
  rbCorner: 'rb-corner',
  lbCorner: 'lb-corner'
};

interface Props {
  model: DocSpriteSheet;
}

function getPointOn(event: React.MouseEvent<any>, relateOn?: HTMLElement) {
  relateOn = relateOn || event.currentTarget as HTMLElement;
  const bbox = relateOn.getBoundingClientRect();
  return {
    x: event.clientX - bbox.left + relateOn.scrollLeft,
    y: event.clientY - bbox.top + relateOn.scrollTop
  };
}

function getFrameStyle(rect: Rect, model: DocSpriteSheet, ofs?: Point): React.CSSProperties {
  ofs = ofs || {x: 0, y: 0};
  return {
    position: 'relative',
    border: '1px solid black',
    backgroundImage: `url(${model.getImageUrl()})`,
    backgroundPosition: `${-(rect.x + ofs.x)}px ${-(rect.y + ofs.y)}px`,
    width: rect.width,
    height: rect.height,
    display: 'inline-block'
  };
}

class Preview extends React.Component<{anim: Animation, model: DocSpriteSheet}, {idx: number, time: number}> {
  private play: boolean = true;
  private timerId: any;

  constructor(props) {
    super(props);

    this.state = {idx: 0, time: 100};
  }

  nextFrame = () => {
    if (this.timerId != null) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }

    this.setState({idx: this.state.idx + 1});
    if (this.play)
      this.timerId = setTimeout(this.nextFrame, this.state.time);
  }

  togglePlay() {
    this.play = !this.play;
    if (this.play) {
      this.nextFrame();
    } else {
      this.setState({});
    }
  }

  componentDidMount() {
    this.nextFrame();
  }

  componentWillUnmount() {
    this.play = false;
  }

  onAddSpeed(addTime: number) {
    const time = clamp(this.state.time + addTime, 50, 300);
    this.setState({time});
  }

  onNextFrame(add: number) {
    this.setState({idx: this.state.idx + add});
    this.play = false;
  }

  render() {
    const { anim, model } = this.props;
    const frame = anim.frames[this.state.idx % anim.frames.length];
    if (!frame)
      return null;

    const rectIdx = frame.rect;
    const rects = model.getRects();
    const rect = rects[rectIdx];
    if (!rect)
      return null;

    // const {baseX, baseY} = frame;
    const size = anim.getSize(rects);
    size.width += 10;
    size.height += 10;

    const origin = { x: size.width / 2, y: size.height - 5 };
    let paddingLeft = origin.x - frame.baseX || 0;
    let paddingTop = origin.y - frame.baseY || 0;

    return (
      <div style={{position: 'relative'}}>
        <div>
          <i
            style={{paddingRight: 2}}
            className='fa fa-plus'
            onClick={() => this.onAddSpeed(-50)}
          />
          <i
            style={{paddingRight: 2}}
            className={cn(this.play && 'fa fa-pause' || 'fa fa-play')}
            onClick={() => this.togglePlay()}
          />
          <i
            style={{paddingRight: 2}}
            className='fa fa-minus'
            onClick={() => this.onAddSpeed(50)}
          />
          <i
            style={{paddingRight: 2}}
            className='fa fa-arrow-left'
            onClick={() => this.onNextFrame(-1)}
          />
          <i
            style={{paddingRight: 2}}
            className='fa fa-arrow-right'
            onClick={() => this.onNextFrame(1)}
          />
        </div>
        <div
          tabIndex={0}
          style={{
            paddingLeft,
            paddingTop,
            height: size.height,
            display: 'inline-block',
            overflowY: 'hidden'
          }}
          onKeyDown={e => {
            if (e.keyCode == 37) {
              this.onNextFrame(-1);
            } else if (e.keyCode == 39) {
              this.onNextFrame(1);
            }
          }}
        >
          <div
            style={{...getFrameStyle(rect, model), border: 'none'}}
          />
        </div>
      </div>
    );
  }
}

type Mode = 'add-anim';
interface State {
  rect?: Rect;
  select?: number;
  anim?: number;
  mode?: Mode;
}

export class SpriteSheetView extends React.Component<Props, State> {
  private canvas: React.RefObject<HTMLDivElement> = React.createRef();
  private img: React.RefObject<HTMLImageElement> = React.createRef();

  private animName: HTMLInputElement;
  private onAnimNameRef = e => {
    this.animName = e;
  }

  constructor(props) {
    super(props);

    this.state = {anim: 0};
  }

  renderRects() {
    const { model } = this.props;
    let rects = model.getRects().slice();
    if (this.state.rect)
      rects.push(this.state.rect);

    return rects.map((rect, idx) => {
      return this.renderRect(rect, idx);
    });
  }

  resizeRect = (event: React.MouseEvent<any>, rectIdx: number, corner: 'lt' | 'rt' | 'rb' | 'lb') => {
    const rect = this.props.model.getRects()[rectIdx];
    const map = {
      lt: { get: {x: rect.x, y: rect.y},                            set: pt => ({left: pt.x, top: pt.y})},
      rt: { get: {x: rect.x + rect.width, y: rect.y},               set: pt => ({right: pt.x, top: pt.y})},
      rb: { get: {x: rect.x + rect.width, y: rect.y + rect.height}, set: pt => ({right: pt.x, bottom: pt.y})},
      lb: { get: {x: rect.x, y: rect.y + rect.height},              set: pt => ({left: pt.x, bottom: pt.y})}
    };

    const pt = map[corner].get;
    startDragging({x: pt.x, y: pt.y, minDist: 2}, {
      onDragging: event => {
        const cssRect = {...rectToCSSRect(rect), ...map[corner].set(event)};
        this.props.model.getRects()[rectIdx] = cssRectToRect(cssRect);
        this.setState({});
      },
      onDragEnd: () => {
        this.props.model.getHolder().save();
      }
    })(event.nativeEvent);
  };

  renderRect(rect: Rect, idx: number) {
    return (
      <div
        key={idx}
        onMouseDown={this.onRectMouseDown}
        className={cn(classes.rect, idx == this.state.select && classes.rectSelect)}
        style={{left: rect.x, top: rect.y, width: rect.width, height: rect.height}}
      >
        <div className={cn(classes.corner, classes.ltCorner)} onMouseDown={e => this.resizeRect(e, idx, 'lt')}/>
        <div className={cn(classes.corner, classes.rtCorner)} onMouseDown={e => this.resizeRect(e, idx, 'rt')}/>
        <div className={cn(classes.corner, classes.rbCorner)} onMouseDown={e => this.resizeRect(e, idx, 'rb')}/>
        <div className={cn(classes.corner, classes.lbCorner)} onMouseDown={e => this.resizeRect(e, idx, 'lb')}/>
      </div>
    );
  }

  onCanvasMouseDown = (event: React.MouseEvent<any>) => {
    if (!isLeftDown(event.nativeEvent) || event.target != this.img.current)
      return;

    const { model } = this.props;
    const point = getPointOn(event);

    const rect: CSSRect = {
      left: point.x,
      top: point.y,
      right: 0,
      bottom: 0
    };

    this.setState({select: -1});
    startDragging({x: rect.left, y: rect.top, minDist: 2}, {
      onDragStart: event => {
        this.setState({rect: cssRectToRect(rect)});
      },
      onDragging: event => {
        rect.right = event.x;
        rect.bottom = event.y;
        this.setState({rect: cssRectToRect(rect)});
      },
      onDragEnd: () => {
        const rc = cssRectToRect(rect);
        if (rc.width && rc.height) {
          model.getRects().push(rc);
          model.getHolder().save();
        }
        this.setState({rect: null, select: model.getRects().length - 1});
      }
    })(event.nativeEvent);
  }

  onRectMouseDown = (event: React.MouseEvent<any>) => {
    if (!isLeftDown(event.nativeEvent))
      return;

    const { model } = this.props;
    const select = model.hitTest(getPointOn(event, this.canvas.current));
    if (select == -1)
      return;

    const rect = model.getRects()[select];
    this.setState({ select });
    startDragging({x: rect.x, y: rect.y, minDist: 2}, {
      onDragging: event => {
        rect.x = event.x;
        rect.y = event.y;
        this.setState({});
      },
      onDragEnd: () => {
        model.getHolder().save();
      }
    })(event.nativeEvent);

    event.preventDefault();
    event.stopPropagation();
  }

  onRectContextMenu = (event: React.MouseEvent<any>) => {
    event.preventDefault();
    event.stopPropagation();

    const { model } = this.props;

    const select = model.hitTest(getPointOn(event, this.canvas.current));
    if (select == -1)
      return;

    this.setState({select});

    const items = [
      <MenuItem text='remove' key='remove' onClick={() => {
        model.getRects().splice(this.state.select, 1);
        this.setState({select: -1});
        model.getHolder().save();
      }}/>
    ];
    ContextMenu.show(<Menu>{items}</Menu>, {left: event.clientX, top: event.clientY});
  }

  onNextFrame = () => {
    let select = (Math.max(0, this.state.select) + 1) % this.props.model.getRects().length;

    this.setState({
      select
    });
  };

  onPrevFrame = () => {
    let select = Math.max(0, this.state.select) - 1;
    if (select < 0)
      select = this.props.model.getRects().length - 1;
    this.setState({ select });
  };

  renderPreview() {
    const select = this.state.select;
    const { model } = this.props;
    const rect = this.state.rect || model.getRects()[select];
    if (!rect)
      return null;

    const style: React.CSSProperties = {
      position: 'fixed',
      backgroundColor: 'white',
      right: 16,
      top: 0
    };

    const frame: React.CSSProperties = {
      border: '1px solid black',
      backgroundImage: `url(${model.getImageUrl()})`,
      backgroundPosition: `${-rect.x}px ${-rect.y}px`,
      width: rect.width,
      height: rect.height
    };

    return (
      <div style={style}>
        <div style={{textAlign: 'right'}}>
          <i style={{padding: 3}} className='fa fa-arrow-left' onClick={this.onPrevFrame}/>
          <i style={{padding: 3}} className='fa fa-arrow-right' onClick={this.onNextFrame}/>
        </div>
        <div style={frame}/>
      </div>
    );
  }

  renderRectsTab() {
    const { model } = this.props;
    return (
      <div
        ref={this.canvas}
        className={classes.root}
        onMouseDown={this.onCanvasMouseDown}
        onContextMenu={this.onRectContextMenu}
      >
        <img src={model.getImageUrl()} ref={this.img}/>
        {this.renderRects()}
        {this.renderPreview()}
      </div>
    );
  }

  renderAnimSelect() {
    const { model } = this.props;

    const lst = [];
    const anim = model.getAnim();
    for (let n = 0; n < anim.getLength(); n++) {
      lst.push(<option key={n} value={n}>{anim.get(n).name}</option>);
    }

    if (lst.length == 0) {
      lst.push(<option key={-1} value={-1}>default</option>);
    }

    if (this.state.mode != 'add-anim') {
      return (
        <div>
          <select onChange={event => {
            this.setState({anim: +event.target.value});
          }}>
            {lst}
          </select>
          <i className='fa fa-plus' onClick={() => this.onAppendNewAnim()}/>
        </div>
      );
    } else {
      return (
        <div style={{padding: 3}}>
          <input defaultValue={'anim-' + anim.getLength()} ref={this.onAnimNameRef}/>
          <i className='fa fa-check' onClick={() => this.appendNewAnimImpl()}/>
          <i className='fa fa-ban' onClick={() => this.onCancelNewAnim()}/>
        </div>
      );
    }
  }

  onAppendNewAnim() {
    this.setState({mode: 'add-anim'});
  }

  async appendNewAnimImpl() {
    const anim = this.props.model.getAnim();
    const newName = this.animName.value;
    if (anim.find(v => v.name == newName) != -1)
      return;

    anim.push( await anim.getHolder().createObject(new Animation(newName)) );
    anim.getHolder().save();
    this.setState({mode: null});
  }

  onCancelNewAnim() {
    this.setState({mode: null});
  }

  renderFrameInSequence(idx: number, rect: Rect, props: React.HTMLProps<any>, base?: Point): JSX.Element {
    let basePoint: JSX.Element = null;
    if (base)
      basePoint = <img style={{position: 'absolute', left: base.x - 9, top: base.y - 9}} src='/data/image/cross.png'/>;

    return (
      <div
        key={idx}
        style={getFrameStyle(rect, this.props.model)}
        {...props}
      >
        {basePoint}
      </div>
    );
  }

  dragBase(e: React.MouseEvent<any>, frame: FrameInfo) {
    e.stopPropagation();
    e.preventDefault();
    startDragging({x: frame.baseX || 0, y: frame.baseY || 0}, {
      onDragging: e => {
        frame.baseX = e.x;
        frame.baseY = e.y;
        this.setState({});
      },
      onDragEnd: () => this.getCurrAnim().getHolder().save()
    })(e.nativeEvent);
  }

  getCurrAnim(): Animation {
    const { model } = this.props;
    let { anim } = this.state;
    if (anim >= model.getAnim().getLength())
      anim = 0;

    return model.getAnim().get(anim);
  }

  renderAnimTab() {
    const { model } = this.props;
    let { anim } = this.state;
    if (anim >= model.getAnim().getLength())
      anim = 0;

    const rects = model.getRects();
    const currAnim = model.getAnim().get(anim);
    const animRects = currAnim.frames.map((f, i) => {
      const frInfo = currAnim.frames[i] || {baseX: 0, baseY: 0, rect: 0};

      return this.renderFrameInSequence(i, rects[f.rect], {
        onDoubleClick: e => {
          currAnim.frames.splice(i, 1);
          this.setState({});
          currAnim.getHolder().save();
        },
        onMouseDown: e => this.dragBase(e, frInfo)
      }, {
        x: frInfo.baseX,
        y: frInfo.baseY
      });
    });

    const allFrames = rects.map((rect, i) => {
      return (
        <div
          key={i}
          style={getFrameStyle(rect, this.props.model)}
          onDoubleClick={e => {
            currAnim.frames.push({rect: i, baseX: 0, baseY: 0});
            this.setState({});
            currAnim.getHolder().save();
          }}
        />
      );
    });

    return (
      <React.Fragment>
        {this.renderAnimSelect()}
        {<Preview model={this.props.model} anim={currAnim}/>}
        <div style={{whiteSpace: 'nowrap', overflow: 'auto', minHeight: 50}}>
          {animRects}
        </div>
        <div style={{whiteSpace: 'nowrap', overflow: 'auto', minHeight: 50}}>
          {allFrames}
        </div>
      </React.Fragment>
    );
  }

  renderTabContent(content: JSX.Element) {
    return (
      <div style={{position: 'absolute', top: 42, left: 0, right: 0, bottom: 0}}>
        {content}
      </div>
    );
  }

  render() {
    return (
      <Tabs id='tabs'>
        <Tab id='rects' title='rects' panel={this.renderTabContent(this.renderRectsTab())}/>
        <Tab id='anim' title='anim' panel={this.renderTabContent(this.renderAnimTab())}/>
      </Tabs>
    );
  }
}

export class SpriteConfig extends DocConfig<DocSpriteSheetArgs> {
  private ref: React.RefObject<HTMLSelectElement> = React.createRef();

  getFiles() {
    return this.props.root.getFiles().filter(file => ['.png', '.jpg'].indexOf(file.getExt()) != -1);
  }

  componentDidMount() {
    const files = this.getFiles();
    this.config.file = files[0];
  }

  render() {
    const files = this.getFiles();
    return (
      <div>
        <select
          ref={this.ref}
          onChange={evt => {
            this.config.file = files[evt.currentTarget.value];
          }}>
          {files.map((item, i) => {
            return <option key={i} value={i} title={item.getOriginName()}>{item.getName()}</option>;
          })}
        </select>
      </div>
    );
  }
}
