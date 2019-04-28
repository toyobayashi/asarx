import * as React from 'react'
import { connect } from 'react-redux'
import { withRouter, RouteComponentProps } from 'react-router-dom'
import { AppState, setAsarPath, AppAction } from './store'
import { Dispatch } from 'redux'
import Asar from './asar'
import Tree from './Tree'

interface Props extends RouteComponentProps {
  asarPath?: string
  dispatch?: Dispatch<AppAction>
  setAsarPath? (path: string): AppAction<string>
}

interface State {
  tree: AsarNode
}

class Detail extends React.Component<Props, State> {
  private _asar: Asar = new Asar()

  render () {
    const { location, history } = this.props

    return (
      <div>
        <button onClick={() => history.goBack()}>back</button>
        {location.pathname}, {this.props.asarPath}
        <hr />
        <Tree data={this.state.tree} title={this.props.asarPath} />
        <hr />
        <pre style={{ width: '100%',wordWrap: 'break-word', whiteSpace: 'pre-wrap' }}>{JSON.stringify(this.state.tree, null, 2)}</pre>
      </div>
    )
  }

  constructor (props: Props) {
    super(props)

    this.state = {
      tree: { files: {} }
    }
  }

  componentDidMount () {
    this.readHeader()
  }

  componentWillUnmount () {
    this.props.setAsarPath && this.props.setAsarPath('')
    this.setState({ tree: { files: {} } })
  }

  readHeader () {
    if (this.props.asarPath) {
      this._asar.load(this.props.asarPath)
      this.setState({ tree: this._asar.header })
    } else {
      this.setState({ tree: {
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
      } })
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
