import { createStore, Action } from 'redux'
import Asar from './asar'
import { deepCopy } from './util'

export interface AppState {
  asarPath: string,
  tree: AsarNode
}

export enum ActionType {
  SET_ASAR_PATH,
  SET_TREE,
  CLICK_TREE,
  CLICK_LIST,
  CLEAR_TREE
}

export interface AppAction<T = any> extends Action<ActionType> {
  value?: T
}

const data: AppState = {
  asarPath: '',
  tree: { files: {} }
}

export function setAsarPath (value: string): AppAction<string> {
  return {
    type: ActionType.SET_ASAR_PATH,
    value
  }
}

export function setTree (value: AsarNode): AppAction<AsarNode> {
  return {
    type: ActionType.SET_TREE,
    value
  }
}

export function clickTree (value: AsarNode): AppAction<AsarNode> {
  return {
    type: ActionType.CLICK_TREE,
    value
  }
}

export function clickList (value: AsarNode | null): AppAction<AsarNode | null> {
  return {
    type: ActionType.CLICK_LIST,
    value
  }
}

export function clearTree (): AppAction<void> {
  return {
    type: ActionType.CLEAR_TREE
  }
}

function reducer (state: AppState = data, action: AppAction): AppState {
  switch (action.type) {
    case ActionType.SET_ASAR_PATH:
      return {
        ...state,
        asarPath: action.value
      }
    case ActionType.SET_TREE:
      return {
        ...state,
        tree: action.value
      }
    case ActionType.CLICK_TREE: {
      const node = action.value
      const prevTree = state.tree
      Asar.each(prevTree, (n) => {
        n._active = false
        n._focused = false
        if (n === node) {
          if (n.files) {
            n._open = !n._open
          }
          n._active = true
        }
      })
      return {
        ...state,
        tree: deepCopy<AsarNode>(prevTree)
      }
    }
    case ActionType.CLICK_LIST: {
      const node = action.value
      const prevTree = state.tree
      Asar.each(prevTree, (n) => {
        n._focused = false
        if (n === node) {
          n._focused = true
        }
      })
      return {
        ...state,
        tree: deepCopy<AsarNode>(prevTree)
      }
    }
    case ActionType.CLEAR_TREE:
      return {
        ...state,
        tree: { files: {} }
      }
    default:
      return state
  }
}

const store = createStore(reducer)

export default store
