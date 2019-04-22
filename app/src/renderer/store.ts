import { createStore, Action } from 'redux'

export interface AppState {
  asarPath: string
}

export enum ActionType {
  SET_ASAR_PATH
}

export interface AppAction<T = any> extends Action<ActionType> {
  value?: T
}

const data: AppState = {
  asarPath: ''
}

export function setAsarPath (value: string): AppAction<string> {
  return {
    type: ActionType.SET_ASAR_PATH,
    value
  }
}

function reducer (state: AppState = data, action: AppAction): AppState {
  switch (action.type) {
    case ActionType.SET_ASAR_PATH:
      return {
        ...state,
        asarPath: action.value
      }
    default:
      return state
  }
}

const store = createStore(reducer)

export default store
