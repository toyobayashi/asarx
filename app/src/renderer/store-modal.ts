import { AppAction } from './store'
import { ActionType } from './store-action'

export interface ModalState {
  show?: boolean
  totalMax?: number
  totalPos?: number
  currentMax?: number
  currentPos?: number
  text?: string
}

const data: ModalState = {
  show: false,
  totalMax: 100,
  totalPos: 0,
  currentMax: 100,
  currentPos: 0,
  text: ''
}

export function toggleModal (value: boolean): AppAction<boolean> {
  return {
    type: ActionType.TOGGLE_MODAL,
    value
  }
}

export function setModalData (value: ModalState): AppAction<ModalState> {
  return {
    type: ActionType.SET_MODAL_DATA,
    value
  }
}

export function modalReducer (state: ModalState = data, action: AppAction) {
  switch (action.type) {
    case ActionType.TOGGLE_MODAL:
      return {
        ...state,
        show: action.value
      }
    case ActionType.SET_MODAL_DATA:
      return {
        ...state,
        ...action.value
      }
    default:
      return state
  }
}
