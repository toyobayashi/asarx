import './detail.css'
import * as React from 'react'
import { connect } from 'react-redux'
import { withRouter, RouteComponentProps } from 'react-router-dom'
import { AppState, setAsarPath, AppAction, setTree, clearTree, clickTree, clickList, ListItem, control, shift, doubleClickList } from './store'
import { Dispatch } from 'redux'
import Asar from './asar'
import Tree from './Tree'
import FileList from './FileList'
import { remote } from 'electron'
import { basename } from 'path'
import { getClass } from './sync'

interface Props extends RouteComponentProps {
  asarPath?: string
  tree?: AsarNode
  list?: ListItem[]
  dispatch?: Dispatch<AppAction>

  setAsarPath? (path: string): AppAction<string>
  setTree? (tree: AsarNode): AppAction<AsarNode>
  clickTree? (tree: AsarNode): AppAction<AsarNode>
  clickList? (tree: ListItem | null): AppAction<ListItem | null>
  doubleClickList? (tree: ListItem | null): AppAction<ListItem | null>
  clearTree? (): AppAction<void>
  control? (v: boolean): AppAction<boolean>
  shift? (v: boolean): AppAction<boolean>
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
          <button onClick={this._extractClicked}>extract</button>
          {location.pathname}, {this.props.asarPath}, {this._activePath}
        </div>
        <div className='content'>
          <div className='tree-view'>
            <Tree data={this.props.tree} title={basename(this.props.asarPath || '')} hideFile={true} onItemClicked={this._onItemClicked} />
          </div>
          <div className='list-view' onClick={this._clearListFocus}>
            <FileList onItemClicked={this._onListItemClicked} onItemDoubleClicked={this._onListItemDoubleClicked} />
            {/* <pre style={{ width: '100%',wordWrap: 'break-word', whiteSpace: 'pre-wrap' }}>{JSON.stringify(this.props.tree, null, 2)}</pre> */}
          </div>
        </div>
      </div>
    )
  }

  private _extractClicked (_e: React.MouseEvent) {
    if (!this.props.list) return
    const selected = this.props.list.filter((item) => item.focused)
    remote.dialog.showOpenDialog({
      properties: ['openDirectory', 'showHiddenFiles', 'createDirectory', 'promptToCreate']
    }, async (paths) => {
      const dest = paths && paths[0]
      if (!dest) return
      console.log((getClass('Api') as Api).mkdirsSync(dest))
      if (selected.length) {
        await this._asar.extractItems(selected.map((item) => item.path), dest, function (info) {
          console.log(info)
        })
      } else {
        await this._asar.extractItems('/', dest, function (info) {
          console.log(info)
        })
      }
    })
  }

  private _clearListFocus (_e: React.MouseEvent) {
    this.props.clickList && this.props.clickList(null)
  }

  private get _activePath (): string {
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

  // private get _activeNode (): AsarNode | undefined {
  //   let res
  //   Asar.each(this.props.tree as AsarNode, (n) => {
  //     if (n._active) {
  //       res = n
  //       return true
  //     }
  //     return false
  //   })
  //   return res
  // }

  private _onItemClicked (node: AsarNode | null) {
    if (node) {
      this.props.clickTree && this.props.clickTree(node)
    }
    console.log(node)
  }

  private _onListItemClicked (node: ListItem | null) {
    this.props.clickList && this.props.clickList(node)
  }

  private _onListItemDoubleClicked (node: ListItem | null) {
    this.props.doubleClickList && this.props.doubleClickList(node)
    console.log(node)
  }

  constructor (props: Props) {
    super(props)

    this._onItemClicked = this._onItemClicked.bind(this)
    this._onListItemClicked = this._onListItemClicked.bind(this)
    this._onListItemDoubleClicked = this._onListItemDoubleClicked.bind(this)
    this._onKeyDown = this._onKeyDown.bind(this)
    this._onKeyUp = this._onKeyUp.bind(this)
    this._clearListFocus = this._clearListFocus.bind(this)
    this._extractClicked = this._extractClicked.bind(this)
  }

  private _onKeyDown (e: KeyboardEvent) {
    if (e.key === 'Control') {
      this.props.control && this.props.control(true)
    } else if (e.key === 'Shift') {
      this.props.shift && this.props.shift(true)
    }
  }

  private _onKeyUp (e: KeyboardEvent) {
    if (e.key === 'Control') {
      this.props.control && this.props.control(false)
    } else if (e.key === 'Shift') {
      this.props.shift && this.props.shift(false)
    }
  }

  componentDidMount () {
    this.readHeader()
    document.addEventListener('keydown', this._onKeyDown)
    document.addEventListener('keyup', this._onKeyUp)
  }

  componentWillUnmount () {
    this.props.setAsarPath && this.props.setAsarPath('')
    this.props.clearTree && this.props.clearTree()

    document.removeEventListener('keydown', this._onKeyDown)
    document.removeEventListener('keyup', this._onKeyUp)
  }

  readHeader () {
    if (this.props.asarPath) {
      this._asar.load(this.props.asarPath)
      this.props.setTree && this.props.setTree(this._asar.header)
      this._onItemClicked(this._asar.header)
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
    tree: state.tree,
    list: state.list
  }),
  (dispatch: Dispatch<AppAction>, _ownProps: Props) => ({
    dispatch,
    setAsarPath: (path: string) => dispatch(setAsarPath(path)),
    setTree: (tree: AsarNode) => dispatch(setTree(tree)),
    clickTree: (tree: AsarNode) => dispatch(clickTree(tree)),
    clickList: (tree: ListItem | null) => dispatch(clickList(tree)),
    doubleClickList: (tree: ListItem | null) => dispatch(doubleClickList(tree)),
    clearTree: () => dispatch(clearTree()),
    control: (v: boolean) => dispatch(control(v)),
    shift: (v: boolean) => dispatch(shift(v))
  })
)(Detail))
