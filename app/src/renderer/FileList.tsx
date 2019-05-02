import './file-list.css'

import * as React from 'react'
import generateObjectID from '../common/id'

interface Props {
  data?: AsarNode
  cdDotDot?: boolean
  onItemClicked?: (node: AsarNode | null) => void
  onItemDoubleClicked?: (node: AsarNode | null) => void
}

interface States {
  nameWidth: number
  point: [number, number] | null
  cdDotDotFocused: boolean
}

class FileList extends React.Component<Props, States> {
  render () {
    const data = this.props.data || null

    const folderItem = []
    const fileItem = []

    if (this.props.cdDotDot) {
      folderItem.push(
        <FileListItem
          className={this.state.cdDotDotFocused ? 'focused' : ''}
          onClick={this._onListItemClicked}
          onDoubleClick={this.props.onItemDoubleClicked}
          key={generateObjectID()}
          columns={[{
            className: 'name-column cell',
            style: { width: this.state.nameWidth + 'px' },
            text: '..'
          }, {
            className: 'size-column cell',
            style: { width: `calc(100% - ${this.state.nameWidth}px)` }
          }]} />
      )
    }

    if (data && data.files) {
      for (let name in data.files) {
        let className = data.files[name]._focused ? 'focused' : undefined
        if (data.files[name].files) {
          folderItem.push(
            <FileListItem
              className={className}
              onClick={this._onListItemClicked}
              onDoubleClick={this.props.onItemDoubleClicked}
              key={generateObjectID()}
              data={data.files[name]}
              columns={[{
                className: 'name-column cell',
                style: { width: this.state.nameWidth + 'px' },
                text: name
              }, {
                className: 'size-column cell',
                style: { width: `calc(100% - ${this.state.nameWidth}px)` }
              }]} />
          )
        } else {
          fileItem.push(
            <FileListItem
              className={className}
              onClick={this._onListItemClicked}
              onDoubleClick={this.props.onItemDoubleClicked}
              key={generateObjectID()}
              data={data.files[name]}
              columns={[{
                className: 'name-column cell',
                style: { width: this.state.nameWidth + 'px' },
                text: name
              }, {
                className: 'size-column cell',
                style: { width: `calc(100% - ${this.state.nameWidth}px)` },
                text: data.files[name].size || NaN
              }]} />
          )
        }
      }
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
            text: 'Size (Byte)'
          }]} />
        <div className='body'>
          {[...folderItem, ...fileItem]}
        </div>
        <div className='resize' style={{ left: `${this.state.nameWidth - 4}px` }} onMouseDown={this._onMouseDown}></div>
      </div>
    )
  }

  private _onListItemClicked (node: AsarNode | null) {
    if (!node) {
      this.setState({
        cdDotDotFocused: true
      })
    } else {
      this.setState({
        cdDotDotFocused: false
      })
    }
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
  data?: AsarNode
  onClick?: (node: AsarNode | null) => void
  onDoubleClick?: (node: AsarNode | null) => void
}

class FileListItem extends React.Component<FileListItemProps> {
  render () {
    const className = this.props.className || ''
    const columns = this.props.columns || []

    let classList = ['row']
    if (className) {
      classList = [...classList, ...className.split(' ')]
    }

    const columnDom = columns.map(c => (<div className={c.className} style={c.style} key={generateObjectID()}>{c.text}</div>))

    return (
      <div className={classList.join(' ')} onClick={this._onClick} onDoubleClick={this._onDoubleClick}>
        {columnDom}
      </div>
    )
  }

  constructor (props: FileListItemProps) {
    super(props)

    this._onClick = this._onClick.bind(this)
    this._onDoubleClick = this._onDoubleClick.bind(this)
  }

  private _onClick (_e: React.MouseEvent) {
    const data = this.props.data || null
    this.props.onClick && this.props.onClick(data)
  }

  private _onDoubleClick (_e: React.MouseEvent) {
    const data = this.props.data || null
    this.props.onDoubleClick && this.props.onDoubleClick(data)
  }
}

export default FileList
