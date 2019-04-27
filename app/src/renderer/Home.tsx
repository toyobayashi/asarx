import './home.css'
import { remote } from 'electron'
import * as React from 'react'
import { connect } from 'react-redux'
import { AppAction, setAsarPath } from './store'
import { Dispatch } from 'redux'
import { withRouter, RouteComponentProps } from 'react-router-dom'
import { extname } from 'path'

interface Props extends RouteComponentProps {
  dispatch?: Dispatch<AppAction>
  setAsarPath? (path: string): AppAction<string>
}

interface States {}

class Home extends React.Component<Props, States> {
  render () {
    return (
      <div className='home full-screen flex-center' onDrop={this.onDrop} onDragOver={this.onDragOver} >
        <button className='open' onClick={this.open}>OPEN AN ASAR ARCHIVE</button>
      </div>
    )
  }

  constructor (props: Props) {
    super(props)
    this.open = this.open.bind(this)
    this.onDrop = this.onDrop.bind(this)
  }

  onDrop (e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    e.stopPropagation()
    this.goDetail((e.dataTransfer).files[0].path)
    // this.handleDrop(e.dataTransfer.files)
  }

  onDragOver (e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    e.stopPropagation()
  }

  // componentDidMount () {
  //   console.log(this.props.history)
  // }

  goDetail (path: string) {
    if (extname(path) === '.asar') {
      if (this.props.setAsarPath) {
        this.props.setAsarPath(path)
        this.props.history.push('/detail')
      } else {
        alert('Redux error.')
      }
    } else {
      alert('Not an asar file.')
    }
  }

  open () {
    remote.dialog.showOpenDialog({
      properties: ['openFile', 'showHiddenFiles']
    }, (filePaths) => {
      if (filePaths && filePaths.length) {
        this.goDetail(filePaths[0])
      }
    })
  }

  toggleDevtools () {
    const webContents = require('electron').remote.webContents.getFocusedWebContents()
    if (webContents.isDevToolsOpened()) {
      webContents.closeDevTools()
    } else {
      webContents.openDevTools()
    }
  }
}

export default withRouter(connect(
  null,
  (dispatch: Dispatch<AppAction>, _ownProps: Props) => ({
    dispatch,
    setAsarPath: (path: string) => dispatch(setAsarPath(path))
  })
)(Home))
