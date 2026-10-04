import type {ViewState} from '../types/view-state.js'
import {clearCookiesWithPrefix, readCookiesWithPrefix, writeCookie} from './cookies.js'

const SAVED_PATH_COOKIE = 'codegraphPath'
const VIEW_STATE_COOKIE_PREFIX = 'codegraphViewState_'

export const readSavedPath = () => {
  const entry = document.cookie.split(' ').find((part) => part.startsWith(`${SAVED_PATH_COOKIE}=`))
  return entry ? decodeURIComponent(entry.slice(SAVED_PATH_COOKIE.length + 1)) : ''
}

export const savePath = (value: string) => {
  writeCookie(SAVED_PATH_COOKIE, value)
}

/*
  Save to cookies and localStorage
  - Cookies are limited in size. If the settings are too large, optional data is removed from the cookie: node colors, hidden node IDs
  - LocalStorage saves EVERYTHING you modify/set within the canvas/filters
 */
export const saveViewState = (fullState: ViewState) => {
  const cookieState: ViewState = {...fullState, positions: {}}
  let cookieValue = encodeURIComponent(JSON.stringify(cookieState))
  if (cookieValue.length > 3500) {
    cookieState.hiddenNodeIds = []
    cookieState.nodeColors = {}
    cookieValue = encodeURIComponent(JSON.stringify(cookieState))
  }
  clearCookiesWithPrefix(VIEW_STATE_COOKIE_PREFIX)
  document.cookie = `${VIEW_STATE_COOKIE_PREFIX}0=${cookieValue}; ` + `max-age=31536000; path=/; SameSite=Lax`;
  try {
    localStorage.setItem(VIEW_STATE_COOKIE_PREFIX, JSON.stringify(fullState))
  } catch {
    // storage may be unavailable (private browsing, quota) - ignore
  }
}

// Load data from cookies and local storage
export const readViewState: () => (ViewState | undefined) = (): ViewState | undefined => {
  const cookieSerialized = readCookiesWithPrefix(VIEW_STATE_COOKIE_PREFIX)
  let cookieState: Partial<ViewState> | undefined
  let localState: ViewState | undefined
  try {
    if (cookieSerialized) cookieState = JSON.parse(decodeURIComponent(cookieSerialized)) as Partial<ViewState>
  } catch {
    // ignore malformed cookie state
  }
  try {
    const stored = localStorage.getItem(VIEW_STATE_COOKIE_PREFIX)
    if (stored) localState = JSON.parse(stored) as ViewState
  } catch {
    // ignore malformed local storage state
  }
  if (!cookieState && !localState) return undefined
  return {
    ...(localState ?? {}),
    ...(cookieState ?? {}),
    positions: localState?.positions ?? cookieState?.positions ?? {},
  } as ViewState
}
