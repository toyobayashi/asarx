import store, { AppAction, ListItem } from './store'
import { ActionType } from './store-action'
import Asar from './asar'
import { remote } from 'electron'
import { getClass } from './sync'

const Api: Api = getClass('Api')

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

export async function extractItem (asar: Asar, dest: string, selected: ListItem[]) {
  if (!dest) return
  console.log(Api.mkdirsSync(dest))
  let totalMax: number = 0
  let totalPos: number = 0
  if (selected.length) {
    selected.forEach((item) => {
      totalMax += (item.node ? Asar.totalSize(item.node) : 0)
    })

    try {
      // this.props.toggleModal && this.props.toggleModal(true)
      store.dispatch(toggleModal(true))
      let start = Date.now()
      await asar.extractItems(selected.map((item) => item.path), dest, (info) => {
        totalPos += info.size
        const now = Date.now()
        if (now - start >= 100) {
          start = now
          store.dispatch(setModalData({
            totalMax: totalMax,
            totalPos: totalPos,
            currentMax: info.total,
            currentPos: info.current,
            text: info.filename
          }))
        }
      })
      store.dispatch(toggleModal(false))
      remote.shell.openExternal(dest)
    } catch (err) {
      store.dispatch(toggleModal(false))
      remote.dialog.showErrorBox('Error', err.message)
      // store.dispatch(setModalData({
      //   text: err.message
      // }))
    }
  } else {
    totalMax += Asar.totalSize(store.getState().tree || { files: {} })
    try {
      store.dispatch(toggleModal(true))
      let start = Date.now()
      await asar.extractItems('/', dest, (info) => {
        totalPos += info.size
        const now = Date.now()
        if (now - start >= 100) {
          start = now
          store.dispatch(setModalData({
            totalMax: totalMax,
            totalPos: totalPos,
            currentMax: info.total,
            currentPos: info.current,
            text: info.filename
          }))
        }
      })
      store.dispatch(toggleModal(false))
      remote.shell.openExternal(dest)
    } catch (err) {
      store.dispatch(toggleModal(false))
      remote.dialog.showErrorBox('Error', err.message)
      // store.dispatch(setModalData({
      //   text: err.message
      // }))
    }
  }
}
