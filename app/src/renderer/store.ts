import { createStore, Action } from 'redux'
import Asar from './asar'
import { deepCopy } from './util'
import { join, dirname } from 'path'
import { getClass } from './sync'

const Api: Api = getClass('Api')

export interface ListItem {
  node: AsarNode | null
  path: string
  focused?: boolean
}

export interface AppState {
  asarPath: string
  asarSize: number
  tree: AsarNode
  list: ListItem[]
  controllDown: boolean
  shiftDown: boolean
}

export enum ActionType {
  SET_ASAR_PATH,
  SET_TREE,
  CLICK_TREE,
  CLICK_LIST,
  DOUBLE_CLICK_LIST,
  CLEAR_TREE,
  CONTROL,
  SHIFT
}

export interface AppAction<T = any> extends Action<ActionType> {
  value?: T
}

let lastClickedItemIndex = -1

const data: AppState = {
  asarPath: '',
  asarSize: 0,
  tree: { files: {} },
  list: [],
  controllDown: false,
  shiftDown: false
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

export function clickList (value: ListItem | null): AppAction<ListItem | null> {
  return {
    type: ActionType.CLICK_LIST,
    value
  }
}

export function doubleClickList (value: ListItem | null): AppAction<ListItem | null> {
  return {
    type: ActionType.DOUBLE_CLICK_LIST,
    value
  }
}

export function clearTree (): AppAction<void> {
  return {
    type: ActionType.CLEAR_TREE
  }
}

export function control (value: boolean): AppAction<boolean> {
  return {
    type: ActionType.CONTROL,
    value
  }
}

export function shift (value: boolean): AppAction<boolean> {
  return {
    type: ActionType.SHIFT,
    value
  }
}

const store = createStore(reducer)

export default store

function _clickTree (node: AsarNode, tree: AsarNode, fold: boolean = false) {
  const folders: ListItem[] = []
  const files: ListItem[] = []

  Asar.each(tree, (n, path) => {
    n._active = false
    if (n === node) {
      if (n.files) {
        if (fold) {
          n._open = !n._open
        } else {
          if (!n._open) n._open = true
        }

        if (path !== '/') {
          folders.push({
            node: null,
            path: '..',
            focused: false
          })
        }

        for (let name in n.files) {
          if (n.files[name].files) {
            folders.push({
              node: n.files[name],
              path: join(path, name).replace(/\\/g, '/'),
              focused: false
            })
          } else {
            files.push({
              node: n.files[name],
              path: join(path, name).replace(/\\/g, '/'),
              focused: false
            })
          }
        }
      }
      n._active = true
    }
  }, '/')

  return {
    list: [...folders, ...files],
    tree
  }
}

function reducer (state: AppState = data, action: AppAction): AppState {
  switch (action.type) {
    case ActionType.SET_ASAR_PATH:
      let size: number
      try {
        if (action.value !== '') {
          size = Api.readFileSizeSync(action.value)
        } else {
          size = 0
        }
      } catch (_err) {
        size = 0
      }
      return {
        ...state,
        list: [],
        tree: { files: {} },
        asarPath: action.value,
        asarSize: size
      }
    case ActionType.SET_TREE:
      return {
        ...state,
        list: [],
        tree: action.value
      }
    case ActionType.CLICK_TREE: {
      const { tree, list } = _clickTree(action.value, state.tree, true)

      return {
        ...state,
        list,
        tree: deepCopy<AsarNode>(tree)
      }
    }
    case ActionType.CLICK_LIST: {
      const listItem = action.value

      if (state.shiftDown) {
        let index = -1
        for (let i = 0; i < state.list.length; i++) {
          if (state.list[i] === listItem) {
            index = i
          }
        }

        if (index !== lastClickedItemIndex && lastClickedItemIndex !== -1) {
          let start = index < lastClickedItemIndex ? index : lastClickedItemIndex
          let end = index < lastClickedItemIndex ? lastClickedItemIndex : index

          for (let i = 0; i < state.list.length; i++) {
            if (i <= end && i >= start) state.list[i].focused = true
            else state.list[i].focused = false
          }
        } else {
          for (let i = 0; i < state.list.length; i++) {
            if (state.list[i] === listItem) {
              state.list[i].focused = true
              lastClickedItemIndex = i
            }
          }
        }
      } else if (state.controllDown) {
        for (let i = 0; i < state.list.length; i++) {
          if (state.list[i] === listItem) {
            state.list[i].focused = !state.list[i].focused
            lastClickedItemIndex = i
          }
        }
      } else {
        for (let i = 0; i < state.list.length; i++) {
          if (state.list[i] === listItem) {
            state.list[i].focused = true
            lastClickedItemIndex = i
          } else {
            state.list[i].focused = false
          }
        }
      }

      return {
        ...state,
        list: deepCopy<ListItem[]>(state.list)
      }
    }
    case ActionType.CLEAR_TREE:
      return {
        ...state,
        list: [],
        tree: { files: {} }
      }
    case ActionType.DOUBLE_CLICK_LIST:
      const listItem = action.value
      let currentDir = ''
      Asar.each(state.tree, (n, path) => {
        if (n._active) {
          currentDir = path
          return true
        }
        return false
      }, '/')

      if (!listItem.node) {
        currentDir = dirname(currentDir).replace(/\\/g, '/')
        const cdNode = Asar.getNode(state.tree, currentDir)
        if (!cdNode) return state
        const { tree, list } = _clickTree(cdNode, state.tree)
        lastClickedItemIndex = -1
        return {
          ...state,
          list,
          tree: deepCopy<AsarNode>(tree)
        }
      } else if (listItem.node.files) {
        currentDir = listItem.path
        const cdNode = Asar.getNode(state.tree, currentDir)
        if (!cdNode) return state
        const { tree, list } = _clickTree(cdNode, state.tree)
        return {
          ...state,
          list,
          tree: deepCopy<AsarNode>(tree)
        }
      } else {
        return state
      }
    case ActionType.CONTROL:
      return {
        ...state,
        controllDown: action.value
      }
    case ActionType.SHIFT:
      return {
        ...state,
        shiftDown: action.value
      }
    default:
      return state
  }
}
