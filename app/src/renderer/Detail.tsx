import './detail.css'
import * as React from 'react'
import { connect } from 'react-redux'
import { withRouter, RouteComponentProps } from 'react-router-dom'
import { AppState, setAsarPath, AppAction, setTree, clearTree, updateTree } from './store'
import { Dispatch } from 'redux'
import Asar from './asar'
import Tree from './Tree'

interface Props extends RouteComponentProps {
  asarPath?: string
  tree?: AsarNode
  dispatch?: Dispatch<AppAction>

  setAsarPath? (path: string): AppAction<string>
  setTree? (tree: AsarNode): AppAction<AsarNode>
  updateTree? (tree: AsarNode): AppAction<AsarNode>
  clearTree? (): AppAction<void>
}

interface State {}

class Detail extends React.Component<Props, State> {
  private _asar: Asar = new Asar()

  render () {
    const { location, history } = this.props

    return (
      <div className='full-screen'>
        <div style={{ height: '29px', borderBottom: '1px solid #333' }}>
          <button onClick={() => history.goBack()}>back</button>
          {location.pathname}, {this.props.asarPath}, {this._focusedPath}
        </div>
        <div className='content'>
          <div className='tree-view'>
            <Tree data={this.props.tree} title={this.props.asarPath} hideFile={true} onItemClicked={this._onItemClicked} />
          </div>
          <div className='list-view'>
            <pre style={{ width: '100%',wordWrap: 'break-word', whiteSpace: 'pre-wrap' }}>{JSON.stringify(this.props.tree, null, 2)}</pre>
          </div>
        </div>
      </div>
    )
  }

  private get _focusedPath (): string {
    let res = ''
    Asar.each(this.props.tree as AsarNode, (n, path) => {
      if (n._active) {
        res = path
        return true
      }
      return false
    }, '/')
    return res.replace(/\\/g, '/')
  }

  private _onItemClicked (node: AsarNode | null) {
    if (node) {
      this.props.updateTree && this.props.updateTree(node)
    }
    console.log(node)
  }

  constructor (props: Props) {
    super(props)

    this._onItemClicked = this._onItemClicked.bind(this)
  }

  componentDidMount () {
    this.readHeader()
  }

  componentWillUnmount () {
    this.props.setAsarPath && this.props.setAsarPath('')
    this.props.clearTree && this.props.clearTree()
  }

  readHeader () {
    if (this.props.asarPath) {
      this._asar.load(this.props.asarPath)
      this.props.setTree && this.props.setTree(this._asar.header)
    } else {
      this.props.setTree && this.props.setTree({
        files: {
          folder1: {
            files: {
              file1: {
                size: 80,
                offset: '0'
              },
              file2: {
                size: 40,
                offset: '80'
              },
              file3: {
                size: 233,
                unpacked: true
              }
            }
          },
          folder2: {
            files: {
              file4: {
                size: 20,
                offset: '120'
              }
            }
          },
          file5: {
            size: 100,
            offset: '140'
          }
        }
      })
    }
  }
}

export default withRouter(connect(
  (state: AppState) => ({
    asarPath: state.asarPath,
    tree: state.tree
  }),
  (dispatch: Dispatch<AppAction>, _ownProps: Props) => ({
    dispatch,
    setAsarPath: (path: string) => dispatch(setAsarPath(path)),
    setTree: (tree: AsarNode) => dispatch(setTree(tree)),
    updateTree: (tree: AsarNode) => dispatch(updateTree(tree)),
    clearTree: () => dispatch(clearTree())
  })
)(Detail))
