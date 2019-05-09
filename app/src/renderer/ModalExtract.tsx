import './modal-extract.css'
import * as React from 'react'
import { AppAction, AppState } from './store'
import { Dispatch } from 'redux'
import { connect } from 'react-redux'
import Progress from './Progress'
import { ModalState, toggleModal } from './store-modal'

interface Props extends ModalState {
  dispatch?: Dispatch<AppAction>

  toggleModal? (v: boolean): AppAction<boolean>
}

interface States {}

class ModalExtract extends React.Component<Props, States> {

  render () {
    const totalPos = this.props.totalPos || 0
    const totalMax = this.props.totalMax || 100
    const currentPos = this.props.currentPos || 0
    const currentMax = this.props.currentMax || 100
    return (
      <div className='modal-wrapper'>
        <div className='modal-window'>
          <div className='modal-info'><span>{(Math.floor(10000 * totalPos / totalMax) / 100).toFixed(2) + '%'}</span><span>{totalPos + ' / ' + totalMax}</span></div>
          <Progress max={totalMax} pos={totalPos} />
          <div className='modal-info'><span>{(Math.floor(10000 * currentPos / currentMax) / 100).toFixed(2) + '%'}</span><span>{currentPos + ' / ' + currentMax}</span></div>
          <Progress max={currentMax} pos={currentPos} />
          <div className='modal-info'><span>{this.props.text}</span></div>
          {/* <div className='modal-button-group'><button className='button' onClick={this._cancel}>Cancel</button></div> */}
        </div>
      </div>
    )
  }

  // private _cancel () {
  //   this.props.toggleModal && this.props.toggleModal(false)
  // }

  constructor (props: Props) {
    super(props)
  }
}

export default connect(
  (state: AppState) => ({
    ...state.modal
  }),
  (dispatch: Dispatch<AppAction>, _ownProps: Props) => ({
    dispatch,
    toggleModal: (v: boolean) => dispatch(toggleModal(v))
  })
)(ModalExtract)
