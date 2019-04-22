import * as React from 'react'
import { connect } from 'react-redux'
import { withRouter, RouteComponentProps } from 'react-router-dom'
import { AppState, setAsarPath, AppAction } from './store'
import { Dispatch } from 'redux'
import { readAsarHeader } from './api'
// import { join } from 'path'

interface Props extends RouteComponentProps {
  asarPath?: string
  dispatch?: Dispatch<AppAction>
  setAsarPath? (path: string): AppAction<string>
}

interface State {
  tree: string
}

class Detail extends React.Component<Props, State> {
  render () {
    const { location, history } = this.props

    return (
      <div>
        <button onClick={() => history.goBack()}>back</button>
        {location.pathname}, {this.props.asarPath}
        <hr />
        <pre style={{ width: '100%',wordWrap: 'break-word', whiteSpace: 'pre-wrap' }}>{this.state.tree}</pre>
      </div>
    )
  }

  constructor (props: Props) {
    super(props)

    this.state = {
      tree: ''
    }
  }

  componentDidMount () {
    this.readHeader()
  }

  componentWillUnmount () {
    this.props.setAsarPath && this.props.setAsarPath('')
    this.setState({ tree: '' })
  }

  async readHeader () {
    if (this.props.asarPath) {
      const header = await readAsarHeader(this.props.asarPath)
      this.setState({ tree: JSON.stringify(header, null, 2) })
    }
  }
}

export default withRouter(connect(
  (state: AppState) => ({
    asarPath: state.asarPath
  }),
  (dispatch: Dispatch<AppAction>, _ownProps: Props) => ({
    dispatch,
    setAsarPath: (path: string) => dispatch(setAsarPath(path))
  })
)(Detail))
