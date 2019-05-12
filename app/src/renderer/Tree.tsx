import './tree.css'

import * as React from 'react'

import generateObjectID from '../common/id'

interface State {}

interface Props {
  title?: string
  data?: AsarNode
  hideFile?: boolean
  onItemClicked? (node: AsarNode | null): void
}

class Tree extends React.Component<Props, State> {
  constructor (props: Props) {
    super(props)
  }

  render () {
    const title: string = this.props.title || '/'
    const data: AsarNode = this.props.data || { files: {} }
    return (
      <div className='tree'>
        {this.renderNote(title, data, 0)}
      </div>

      // <div style={{ marginLeft: indent + 'px' }}>
      //   <div>{title}</div>
      //   {
      //     data.files ? Object.keys(data.files).map(item => <Tree title={item} data={(data.files as any)[item]} indent={8} key={generateObjectID()} />) : void 0
      //   }
      // </div>
    )
  }

  renderNote (title: string, asarNode: AsarNode, indent: number) {
    const node: AsarNode = asarNode || { files: {} }
    let dom: JSX.Element[] = []
    if (!this.props.hideFile) dom.push(<TreeItem title={title} data={node} indent={indent} key={generateObjectID()} onItemClicked={this.props.onItemClicked} />)
    if (node.files) {
      if (this.props.hideFile) {
        dom.push(<TreeItem title={title} data={node} indent={indent} key={generateObjectID()} onItemClicked={this.props.onItemClicked} />)
      }
      if (node._open) {
        dom = [...dom, ...resolveArray(Object.keys(node.files).map(item => this.renderNote(item, (node.files as any)[item], indent + 8)))]
      }
    }
    return dom
  }
}

function resolveArray (arr: any[]) {
  let res: JSX.Element[] = []
  for (let i = 0; i < arr.length; i++) {
    Array.isArray(arr[i]) ? res = [...res, ...resolveArray(arr[i])] : res.push(arr[i])
  }
  return res
}

class TreeItem extends React.Component<any, any> {
  constructor (props: any) {
    super(props)

    this.onItemClicked = this.onItemClicked.bind(this)
  }

  render () {
    const title: string = this.props.title || '/'
    const data: AsarNode = this.props.data || null
    const indent: number = this.props.indent || 0

    const className = ['tree-item']
    const itemClassName = ['folder-icon']
    if (data._active) {
      className.push('active')
    }

    if (indent === 0) {
      itemClassName.push('root')
    }

    if (data._open) {
      itemClassName.push('open')
    }

    return (
      <div
        onClick={this.onItemClicked}
        className={className.join(' ')}
        style={{ paddingLeft: indent ? indent + 'px' : void 0 }}
      ><span className={itemClassName.join(' ')}></span><span>{title}</span></div>
    )
  }

  onItemClicked (_e: React.MouseEvent) {
    const onItemClicked: undefined | ((node: AsarNode | null) => void) = this.props.onItemClicked
    if (onItemClicked) {
      onItemClicked(this.props.data || null)
    }
  }
}

export default Tree
