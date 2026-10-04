import {DEFAULT_NODE_TYPES, DEFAULT_PANEL_WIDTHS} from '../lib/constants.js'
import type {ViewState} from '../types/view-state.js'

/**
 * Check /types/view-state.ts for a better understanding of the view state
 */

export type ViewerState = {
  search: string
  edgeKind: string
  relationshipFilter: string
  excludedDirectories: string[]
  nodeTypes: string[]
  includeExternal: boolean
  includeGenerated: boolean
  fullPath: boolean
  limit: number
  maxLimit: number
  hiddenNodeIds: string[]
  nodeColors: Record<string, string>
  focusDepths: Record<string, number>
  focusId?: string
  selectedId?: string
  leftWidth: number
  rightWidth: number
}

export const initialViewerState: ViewerState = {
  search: '',
  edgeKind: 'all',
  relationshipFilter: 'all',
  excludedDirectories: [],
  nodeTypes: [...DEFAULT_NODE_TYPES],
  includeExternal: false,
  includeGenerated: false,
  fullPath: true,
  limit: 1,
  maxLimit: 1,
  hiddenNodeIds: [],
  nodeColors: {},
  focusDepths: {},
  focusId: undefined,
  selectedId: undefined,
  leftWidth: DEFAULT_PANEL_WIDTHS.left,
  rightWidth: DEFAULT_PANEL_WIDTHS.right,
}

export type ViewerAction =
    | { type: 'SET_SEARCH'; value: string }
    | { type: 'SET_EDGE_KIND'; value: string }
    | { type: 'SET_RELATIONSHIP_FILTER'; value: string }
    | { type: 'SET_EXCLUDED_DIRECTORIES'; values: string[] }
    | { type: 'EXCLUDE_DIRECTORY'; directory: string }
    | { type: 'TOGGLE_NODE_TYPE'; value: string }
    | { type: 'SET_INCLUDE_EXTERNAL'; value: boolean }
    | { type: 'SET_INCLUDE_GENERATED'; value: boolean }
    | { type: 'SET_FULL_PATH'; value: boolean }
    | { type: 'SET_LIMIT'; value: number }
    | { type: 'HIDE_NODE'; id: string }
    | { type: 'SET_NODE_COLOR'; id: string; color: string }
    | { type: 'SET_FOCUS'; id?: string }
    | { type: 'SET_FOCUS_DEPTH'; id: string; depth: number }
    | { type: 'SELECT_NODE'; id?: string }
    | { type: 'SET_PANEL_WIDTH'; side: 'left' | 'right'; width: number }
    | { type: 'RESET_FOR_NEW_GRAPH'; maxLimit: number }
    | { type: 'RESET_VIEW' }
    | { type: 'APPLY_VIEW_STATE'; state: ViewState; maxLimit: number };

export const viewerReducer = (state: ViewerState, action: ViewerAction): ViewerState => {
  switch (action.type) {
    case 'SET_SEARCH':
      return {...state, search: action.value}
    case 'SET_EDGE_KIND':
      return {...state, edgeKind: action.value}
    case 'SET_RELATIONSHIP_FILTER':
      return {...state, relationshipFilter: action.value}
    case 'SET_EXCLUDED_DIRECTORIES':
      return {...state, excludedDirectories: action.values}
    case 'EXCLUDE_DIRECTORY':
      return action.directory && !state.excludedDirectories.includes(action.directory)
          ? {...state, excludedDirectories: [...state.excludedDirectories, action.directory]}
          : state
    case 'TOGGLE_NODE_TYPE':
      return {
        ...state,
        nodeTypes: state.nodeTypes.includes(action.value)
            ? state.nodeTypes.filter((value) => value !== action.value)
            : [...state.nodeTypes, action.value],
      }
    case 'SET_INCLUDE_EXTERNAL':
      return {...state, includeExternal: action.value}
    case 'SET_INCLUDE_GENERATED':
      return {...state, includeGenerated: action.value}
    case 'SET_FULL_PATH':
      return {...state, fullPath: action.value}
    case 'SET_LIMIT':
      return {...state, limit: action.value}
    case 'HIDE_NODE':
      return {...state, hiddenNodeIds: [...state.hiddenNodeIds, action.id]}
    case 'SET_NODE_COLOR':
      return {...state, nodeColors: {...state.nodeColors, [action.id]: action.color}}
    case 'SET_FOCUS':
      return {...state, focusId: action.id}
    case 'SET_FOCUS_DEPTH':
      return {...state, focusDepths: {...state.focusDepths, [action.id]: action.depth}}
    case 'SELECT_NODE':
      return {...state, selectedId: action.id}
    case 'SET_PANEL_WIDTH':
      return action.side === 'left' ? {...state, leftWidth: action.width} : {...state, rightWidth: action.width}
    case 'RESET_FOR_NEW_GRAPH':
      return {
        ...initialViewerState,
        maxLimit: action.maxLimit,
        limit: action.maxLimit,
      }
    case 'RESET_VIEW':
      return {
        ...state,
        focusId: undefined,
        focusDepths: {},
        hiddenNodeIds: [],
        nodeColors: {},
        excludedDirectories: [],
        leftWidth: DEFAULT_PANEL_WIDTHS.left,
        rightWidth: DEFAULT_PANEL_WIDTHS.right,
      }
    case 'APPLY_VIEW_STATE': {
      const {state: saved, maxLimit} = action
      return {
        search: saved.search ?? '',
        edgeKind: saved.edgeKind ?? 'all',
        relationshipFilter: ['all', 'connected', 'isolated'].includes(saved.relationshipFilter) ? saved.relationshipFilter : 'all',
        excludedDirectories: saved.excludedDirectories ?? [],
        nodeTypes: saved.nodeTypes ?? [...DEFAULT_NODE_TYPES],
        includeExternal: saved.includeExternal ?? false,
        includeGenerated: saved.includeGenerated ?? false,
        fullPath: saved.fullPath ?? true,
        limit: Math.min(maxLimit, Math.max(1, saved.limit ?? maxLimit)),
        maxLimit,
        hiddenNodeIds: saved.hiddenNodeIds ?? [],
        nodeColors: saved.nodeColors ?? {},
        focusDepths: saved.focusDepths ?? {},
        focusId: saved.focusId,
        selectedId: saved.selectedId,
        leftWidth: Math.min(500, Math.max(180, saved.leftWidth ?? DEFAULT_PANEL_WIDTHS.left)),
        rightWidth: Math.min(500, Math.max(200, saved.rightWidth ?? DEFAULT_PANEL_WIDTHS.right)),
      }
    }
    default:
      return state
  }
}
