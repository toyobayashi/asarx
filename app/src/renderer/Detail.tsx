import './detail.css'
import * as React from 'react'
import { connect } from 'react-redux'
import { withRouter, RouteComponentProps } from 'react-router-dom'
import { AppState, setAsarPath, AppAction, setTree, clearTree, clickTree, clickList, ListItem, control, shift, doubleClickList } from './store'
import { Dispatch } from 'redux'
import Asar from './asar'
import Tree from './Tree'
import FileList from './FileList'
import ModalExtract from './ModalExtract'
import { remote, ipcRenderer } from 'electron'
import { basename, extname } from 'path'
import { getClass } from './sync'
import * as os from 'os'
import { openFile, formatSize } from './util'
import { toggleModal, ModalState, setModalData, extractItem } from './store-modal'

interface Props extends RouteComponentProps {
  asarPath?: string
  asarSize?: number
  tree?: AsarNode
  list?: ListItem[]
  dispatch?: Dispatch<AppAction>
  show?: boolean

  setAsarPath? (path: string): AppAction<string>
  setTree? (tree: AsarNode): AppAction<AsarNode>
  clickTree? (tree: AsarNode): AppAction<AsarNode>
  clickList? (tree: ListItem | null): AppAction<ListItem | null>
  doubleClickList? (value: { node: ListItem | null; asar?: IAsar }): AppAction<{ node: ListItem | null; asar?: IAsar }>
  clearTree? (): AppAction<void>
  control? (v: boolean): AppAction<boolean>
  shift? (v: boolean): AppAction<boolean>

  toggleModal? (v: boolean): AppAction<boolean>
  setModalData? (v: ModalState): AppAction<ModalState>
}

interface State {}

const Api: Api = getClass('Api')

class Detail extends React.Component<Props, State> {
  private _asar: Asar = new Asar()

  render () {
    return (
      <div className='full-screen'>
        {/* <div style={{ height: '29px', borderBottom: '1px solid #333' }}>
          <button onClick={() => history.goBack()}>back</button>
          <button onClick={this._extractClicked}>extract</button>
          {location.pathname}, {this.props.asarPath}, {this._activePath}
        </div> */}
        <div className='menu'>
          <button className='menu-button' onClick={this._open}>Open</button>
          <button className='menu-button' onClick={this._goback}>Close</button>
          <button className='menu-button' onClick={this._extractClicked}>Extract</button>
          <button className='menu-button' onClick={this._openAboutDialog}>About</button>
        </div>
        <div className='content'>
          <div className='tree-view'>
            <Tree data={this.props.tree} title={basename(this.props.asarPath || '')} hideFile={true} onItemClicked={this._onItemClicked} />
          </div>
          <div className='list-view' onClick={this._clearListFocus}>
            <FileList onDragStart={this._onDragStart} onItemClicked={this._onListItemClicked} onItemDoubleClicked={this._onListItemDoubleClicked} />
            {/* <pre style={{ width: '100%',wordWrap: 'break-word', whiteSpace: 'pre-wrap' }}>{JSON.stringify(this.props.tree, null, 2)}</pre> */}
          </div>
        </div>
        <div className='footer'>
          <span>{this._activePath}</span>
          <span>{this._asarDetailString}</span>
        </div>
        {this.props.show ? <ModalExtract /> : void 0}
      </div>
    )
  }

  private _goback () {
    this.props.history.goBack()
  }

  private async _open () {
    const path = await openFile()
    if (!path) return
    if (extname(path) === '.asar') {
      if (this.props.setAsarPath) {
        this.props.setAsarPath(path)
        this.readHeader()
      } else {
        alert('Redux error.')
      }
    } else {
      alert('Not an asar file.')
    }
  }

  private _openAboutDialog (_e: React.MouseEvent) {
    const isSnap = process.platform === 'linux' && process.env.SNAP && process.env.SNAP_REVISION
    const pkg: any = Api.getPackageSync()

    let detail: string = ''
    let commit: string = 'Unknown'
    let date: string = 'Unknown'

    if (process.env.NODE_ENV === 'production') {
      commit = pkg._commit || 'Unknown'
      date = pkg._commitDate || 'Unknown'
    } else {
      const { execSync } = require('child_process')
      try {
        commit = execSync('git rev-parse HEAD').toString().replace(/[\r\n]/g, '')
        date = new Date(execSync('git log -1').toString().match(/Date:\s*(.*?)\n/)[1]).toISOString()
      } catch (_err) {
        console.warn('Git not found in environment')
      }
    }

    detail = `Version: ${pkg.version}\n` +
      `Commit: ${commit}\n` +
      `Date: ${date}\n` +
      `Electron: ${process.versions['electron']}\n` +
      `Chrome: ${process.versions['chrome']}\n` +
      `Node.js: ${process.versions['node']}\n` +
      `V8: ${process.versions['v8']}\n` +
      `OS: ${os.type()} ${os.arch()} ${os.release()}${isSnap ? ' snap' : ''}`

    const buttons = process.platform === 'linux' ? ['Copy', 'OK'] : ['OK', 'Copy']

    remote.dialog.showMessageBox({
      title: pkg.name,
      type: 'info',
      message: pkg.name,
      detail: `\n${detail}`,
      buttons,
      noLink: true,
      defaultId: buttons.indexOf('OK')
    }, (response) => {
      if (buttons[response] === 'Copy') {
        remote.clipboard.writeText(detail)
      }
    })
  }

  private _onDragStart (e: React.DragEvent) {
    e.preventDefault()
    if (!this.props.list) return
    const selected = this.props.list.filter((item) => item.focused)
    ipcRenderer.send('start-drag', this._asar, selected)
    // const callback = (ev: any) => {
    //   console.log(ev)
    //   document.removeEventListener('ondrop', callback)
    // }

    // document.addEventListener('ondrop', callback)
  }

  private _extractClicked (_e: React.MouseEvent) {
    if (!this.props.list) return
    const selected = this.props.list.filter((item) => item.focused)
    remote.dialog.showOpenDialog({
      properties: ['openDirectory', 'showHiddenFiles', 'createDirectory', 'promptToCreate']
    }, async (paths) => {
      await extractItem(this._asar, paths && paths[0], selected)
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

  private get _asarDetailString (): string {
    let folders: number = 0
    let files: number = 0
    Asar.each(this.props.tree as AsarNode, (n) => {
      if (n.files) {
        folders++
      } else {
        files++
      }
    })
    return `Files: ${files}, Folders: ${folders}, Size: ${formatSize(this.props.asarSize || 0) || 'Unknown'}`
  }

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
    this.props.doubleClickList && this.props.doubleClickList({ asar: this._asar, node })
    console.log(node)
  }

  constructor (props: Props) {
    super(props)

    this._onItemClicked = this._onItemClicked.bind(this)
    this._onListItemClicked = this._onListItemClicked.bind(this)
    this._onListItemDoubleClicked = this._onListItemDoubleClicked.bind(this)
    this._onDragStart = this._onDragStart.bind(this)
    this._onKeyDown = this._onKeyDown.bind(this)
    this._onKeyUp = this._onKeyUp.bind(this)
    this._clearListFocus = this._clearListFocus.bind(this)
    this._extractClicked = this._extractClicked.bind(this)
    this._open = this._open.bind(this)
    this._goback = this._goback.bind(this)
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
    list: state.list,
    asarSize: state.asarSize,
    show: state.modal.show
  }),
  (dispatch: Dispatch<AppAction>, _ownProps: Props) => ({
    dispatch,
    setAsarPath: (path: string) => dispatch(setAsarPath(path)),
    setTree: (tree: AsarNode) => dispatch(setTree(tree)),
    clickTree: (tree: AsarNode) => dispatch(clickTree(tree)),
    clickList: (tree: ListItem | null) => dispatch(clickList(tree)),
    doubleClickList: (value: { node: ListItem | null; asar?: IAsar }) => dispatch(doubleClickList(value)),
    clearTree: () => dispatch(clearTree()),
    control: (v: boolean) => dispatch(control(v)),
    shift: (v: boolean) => dispatch(shift(v)),

    toggleModal: (v: boolean) => dispatch(toggleModal(v)),
    setModalData: (v: ModalState) => dispatch(setModalData(v))
  })
)(Detail))
