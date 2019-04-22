import './style.css'
import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { Provider } from 'react-redux'
import { HashRouter } from 'react-router-dom'
import App from './App'
import store from './store'

const render = (Component: typeof React.Component) => {
  ReactDOM.render(
    <HashRouter><Provider store={store}><Component /></Provider></HashRouter>,
    document.getElementById('root')
  )
}

render(App)

if (process.env.NODE_ENV !== 'production') {
  if ((module as any).hot) {
    (module as any).hot.accept()
  }
}
