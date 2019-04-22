import * as React from 'react'
import { Route, Switch } from 'react-router-dom'
import Home from './Home'
import Detail from './Detail'

interface Props {}

interface States {}

class App extends React.Component<Props, States> {
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
}

export default App
