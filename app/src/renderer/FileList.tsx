import './file-list.css'

import * as React from 'react'
import generateObjectID from '../common/id'
import { AppState, AppAction, ListItem } from './store'
import { Dispatch } from 'redux'
import { connect } from 'react-redux'
import { basename } from 'path'
import { formatSize } from './util'

interface Props {
  onItemClicked?: (node: ListItem | null) => void
  onItemDoubleClicked?: (node: ListItem | null) => void
  onDragStart?: (e: React.DragEvent) => void
  list?: ListItem[]
}

interface States {
  nameWidth: number
  point: [number, number] | null
  cdDotDotFocused: boolean
}

class FileList extends React.Component<Props, States> {
  render () {
    const data = this.props.list || []

    const ListBody: JSX.Element[] = []

    for (let i = 0; i < data.length; i++) {
      const item = data[i]
      ListBody.push(<FileListItem
        className={item.focused ? 'focused' : ''}
        onDoubleClick={this.props.onItemDoubleClicked}
        onClick={this.props.onItemClicked}
        onDragStart={this.props.onDragStart}
        key={item.path}
        data={item}
        columns={[{
          className: 'name-column cell',
          style: { width: this.state.nameWidth + 'px' },
          text: item.path === '..' ? '..' : basename(item.path)
        }, {
          className: 'size-column cell',
          style: { width: `calc(100% - ${this.state.nameWidth}px)` },
          text: item.node && typeof item.node.size === 'number' ? formatSize(item.node.size) : ''
        }]} />)
    }

    const rootClass = ['file-list']
    if (this.state.point) {
      rootClass.push('resize')
    }

    return (
      <div className={rootClass.join(' ')} onMouseMove={this._onMouseMove} onMouseUp={this._onMouseUp}>
        <FileListItem
          className='head'
          columns={[{
            className: 'name-column cell',
            style: { width: this.state.nameWidth + 'px' },
            text: 'Name'
          }, {
            className: 'size-column cell',
            style: { width: `calc(100% - ${this.state.nameWidth}px)` },
            text: 'Size'
          }]} />
        <div className='body'>
          {ListBody}
        </div>
        <div className='resize' style={{ left: `${this.state.nameWidth - 4}px` }} onMouseDown={this._onMouseDown}></div>
      </div>
    )
  }

  private _onListItemClicked (node: ListItem | null) {
    this.props.onItemClicked && this.props.onItemClicked(node)
  }

  private _onMouseMove (e: React.MouseEvent) {
    if (this.state.point) {
      const x = e.pageX
      let target: any = e.target
      while (target && !target.classList.contains('file-list')) {
        target = target.parentNode
      }
      if (!target) return
      const targetLeft = target.offsetLeft as number
      const left = this.state.point[0] - targetLeft
      const newWidth = left + x - this.state.point[0]
      this.setState({
        nameWidth: newWidth < 100 ? 100 : newWidth
      })
    }
  }

  private _onMouseDown (e: React.MouseEvent) {
    if (!this.state.point) {
      this.setState({
        point: [e.pageX, e.pageY]
      })
    }
  }

  private _onMouseUp (_e: React.MouseEvent) {
    if (this.state.point) {
      this.setState({
        point: null
      })
    }
  }

  constructor (props: Props) {
    super(props)

    this.state = {
      nameWidth: 300,
      point: null,
      cdDotDotFocused: false
    }

    this._onMouseMove = this._onMouseMove.bind(this)
    this._onMouseDown = this._onMouseDown.bind(this)
    this._onMouseUp = this._onMouseUp.bind(this)
    this._onListItemClicked = this._onListItemClicked.bind(this)
  }
}

interface FileListItemProps {
  className?: string
  columns?: {
    className?: string
    style?: any
    text?: string | number
  }[]
  data?: ListItem
  onClick?: (item: ListItem | null) => void
  onDoubleClick?: (item: ListItem | null) => void
  onDragStart?: (e: React.DragEvent) => void
}

class FileListItem extends React.Component<FileListItemProps> {
  static clickTime: number = -1
  static clickItemPath: string = ''

  render () {
    const className = this.props.className || ''
    const columns = this.props.columns || []

    let classList = ['row']
    if (className) {
      classList = [...classList, ...className.split(' ')]
    }

    const columnDom = columns.map(c => (<div className={c.className} style={c.style} key={generateObjectID()}>{c.text}</div>))

    return (
      <div className={classList.join(' ')} onClick={this._onClick} draggable={false} onDragStart={this.props.onDragStart}>
        {columnDom}
      </div>
    )
  }

  constructor (props: FileListItemProps) {
    super(props)

    this._onClick = this._onClick.bind(this)
  }

  private _onClick (e: React.MouseEvent) {
    const data = this.props.data as ListItem
    this.props.onClick && this.props.onClick(data)

    if (FileListItem.clickTime === -1) {
      FileListItem.clickTime = Date.now()
      FileListItem.clickItemPath = data.path
    } else {

      if (Date.now() - FileListItem.clickTime <= 300 && data.path === FileListItem.clickItemPath) {
        FileListItem.clickTime = -1
        FileListItem.clickItemPath = ''
        this.props.onDoubleClick && this.props.onDoubleClick(data)
      } else {
        FileListItem.clickTime = Date.now()
        FileListItem.clickItemPath = data.path
      }
    }

    e.stopPropagation()
  }
}

export default connect(
  (state: AppState) => ({
    list: state.list
  }),
  (dispatch: Dispatch<AppAction>, _ownProps: Props) => ({
    dispatch
  })
)(FileList)
