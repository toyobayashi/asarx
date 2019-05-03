import * as React from 'react'
import { Route, Switch, withRouter, RouteComponentProps } from 'react-router-dom'
import Home from './Home'
import Detail from './Detail'
import { ipcRenderer, Event } from 'electron'
import { setAsarPath, AppAction } from './store'
import { Dispatch } from 'redux'
import { connect } from 'react-redux'

interface Props extends RouteComponentProps {
  dispatch?: Dispatch<AppAction>
  setAsarPath? (path: string): AppAction<string>
}

interface States {}

class App extends React.Component<Props, States> {
  private static _listen: boolean = false

  render () {
    return (
      <Switch>
        <Route exact path='/' component={Home} />
        <Route path='/detail' component={Detail} />
      </Switch>
    )
  }

  constructor (props: Props) {
    super(props)
  }

  componentWillMount () {
    if (!App._listen) {
      ipcRenderer.once('open-asar', (_e: Event, asarPath: string) => {
        if (asarPath) {
          this.props.setAsarPath && this.props.setAsarPath(asarPath)
          this.props.history.push('/detail')
        }
        ipcRenderer.send('ready-to-show')
      })
      App._listen = true
    }
  }
}

export default withRouter(connect(
  null,
  (dispatch: Dispatch<AppAction>, _ownProps: Props) => ({
    dispatch,
    setAsarPath: (path: string) => dispatch(setAsarPath(path))
  })
)(App))
