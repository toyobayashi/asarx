import * as React from 'react'

import generateObjectID from '../common/id'

interface State {}

interface Props {
  title?: string
  data?: AsarNode
}

class Tree extends React.Component<Props, State> {
  constructor (props: Props) {
    super(props)
  }

  render () {
    const title: string = this.props.title || '/'
    const data: AsarNode = this.props.data || { files: {} }
    return (
      <div>
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
    let dom = [<TreeItem title={title} indent={indent} key={generateObjectID()} />]
    if (node.files) {
      dom = [...dom, ...resolveArray(Object.keys(node.files).map(item => this.renderNote(item, (node.files as any)[item], indent + 8)))]
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

function TreeItem (props: any) {
  const title: string = props.title || '/'
  // const header: AsarNode = props.data || { files: {} }
  const indent: number = props.indent || 0
  return (
    <div style={{ paddingLeft: indent ? indent + 'px' : void 0 }}>{title}</div>
  )
}

export default Tree
