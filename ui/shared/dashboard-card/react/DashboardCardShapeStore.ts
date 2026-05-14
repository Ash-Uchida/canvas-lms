/*
 * Copyright (C) 2026 - present Instructure, Inc.
 *
 * This file is part of Canvas.
 *
 * Canvas is free software: you can redistribute it and/or modify it under
 * the terms of the GNU Affero General Public License as published by the Free
 * Software Foundation, version 3 of the License.
 *
 * Canvas is distributed in the hope that it will be useful, but WITHOUT ANY
 * WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR
 * A PARTICULAR PURPOSE. See the GNU Affero General Public License for more
 * details.
 *
 * You should have received a copy of the GNU Affero General Public License along
 * with this program. If not, see <http://www.gnu.org/licenses/>.
 */

import type {CSSProperties} from 'react'
import {create} from 'zustand'
import {createJSONStorage, persist} from 'zustand/middleware'

// The set of shapes a user can pick for their dashboard course cards.
// Add new shapes here and add a matching `.ic-DashboardCard--shape-{name}`
// rule in app/stylesheets/bundles/dashboard_card.scss (for hover / legacy).
// `dashboardCardShapeInnerStyle` / `dashboardCardShapeWrapStyle` / header link & content
// alignment helpers keep shapes working even when the CSS bundle has not been rebuilt
export const DASHBOARD_CARD_SHAPES = ['rounded', 'circle', 'star', 'cat'] as const

export type DashboardCardShape = (typeof DASHBOARD_CARD_SHAPES)[number]

export const DEFAULT_DASHBOARD_CARD_SHAPE: DashboardCardShape = 'rounded'

export const isDashboardCardShape = (value: unknown): value is DashboardCardShape =>
  typeof value === 'string' && (DASHBOARD_CARD_SHAPES as readonly string[]).includes(value)

interface DashboardCardShapeState {
  shape: DashboardCardShape
  setShape: (shape: DashboardCardShape) => void
  reset: () => void
}

// Fired after setShape and after persist rehydration so legacy-rendered dashcards
// (ReactDOM.render + react-dnd) re-run hooks and pick up the new shape.
export const DASHBOARD_CARD_SHAPE_CHANGED_EVENT = 'canvas:dashboard-card-shape-changed'

function dispatchDashboardCardShapeChanged(shape: DashboardCardShape) {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(DASHBOARD_CARD_SHAPE_CHANGED_EVENT, {detail: shape}))
}

// Persist key must be resolved when reading/writing storage, not once at module
// load (ENV.current_user_id may not exist yet on first evaluation).
const PERSIST_STORAGE_ID = 'canvas-dashboard-card-shape-v2'

function persistStorageKey(): string {
  const id =
    typeof window !== 'undefined' && (window as any).ENV?.current_user_id != null
      ? String((window as any).ENV.current_user_id)
      : 'anonymous'
  return `${PERSIST_STORAGE_ID}:${id}`
}

const dashboardCardPersistStorage = createJSONStorage(() => ({
  getItem: () => localStorage.getItem(persistStorageKey()),
  setItem: (_name: string, value: string) => localStorage.setItem(persistStorageKey(), value),
  removeItem: () => localStorage.removeItem(persistStorageKey()),
}))

export const useDashboardCardShapeStore = create<DashboardCardShapeState>()(
  persist(
    set => ({
      shape: DEFAULT_DASHBOARD_CARD_SHAPE,
      setShape: shape => {
        if (!isDashboardCardShape(shape)) return
        set({shape})
        dispatchDashboardCardShapeChanged(shape)
      },
      reset: () => {
        set({shape: DEFAULT_DASHBOARD_CARD_SHAPE})
        dispatchDashboardCardShapeChanged(DEFAULT_DASHBOARD_CARD_SHAPE)
      },
    }),
    {
      name: PERSIST_STORAGE_ID,
      storage: dashboardCardPersistStorage,
      partialize: state => ({shape: state.shape}),
      migrate: (persistedState, _version) => {
        const candidate =
          persistedState &&
          typeof persistedState === 'object' &&
          'shape' in persistedState &&
          (persistedState as {shape: unknown}).shape
        return {
          shape: isDashboardCardShape(candidate) ? candidate : DEFAULT_DASHBOARD_CARD_SHAPE,
        } as DashboardCardShapeState
      },
      version: 2,
      onRehydrateStorage: () => {
        return (_finishedState: unknown, error?: unknown) => {
          if (error) return
          dispatchDashboardCardShapeChanged(useDashboardCardShapeStore.getState().shape)
        }
      },
    },
  ),
)

// Convenience selector hooks so consumers don't subscribe to the whole store
// when they only need one slice.
export const useDashboardCardShape = (): DashboardCardShape =>
  useDashboardCardShapeStore(state => state.shape)

export const useSetDashboardCardShape = (): ((shape: DashboardCardShape) => void) =>
  useDashboardCardShapeStore(state => state.setShape)

// Returns the CSS modifier class for a given shape, e.g.
// 'ic-DashboardCard--shape-rounded'. Centralised so the naming convention
// stays in lockstep with the SCSS.
export const dashboardCardShapeClassName = (shape: DashboardCardShape): string =>
  `ic-DashboardCard--shape-${shape}`

// Geometry tuned for $ic-DashboardCard-width (262px) and typical card height.
// Circle: true disk using half the card width as radius (like a 150×150 circle scaled to width).
const SHAPE_CLIP_PATH: Record<DashboardCardShape, string | null> = {
  rounded: null,
  circle: 'circle(131px at 50% 131px)',
  star: 'polygon(50% 0%, 63% 38%, 100% 38%, 69% 62%, 82% 100%, 50% 76%, 18% 100%, 31% 62%, 0% 38%, 37% 38%)',
  cat: 'polygon(50% 0%, 72% 18%, 92% 2%, 88% 28%, 100% 40%, 94% 68%, 78% 96%, 50% 100%, 22% 96%, 6% 68%, 0% 40%, 12% 28%, 8% 2%, 28% 18%)',
}

/** Multi-layer drop-shadow approximates default card box-shadow around the clip silhouette. */
export const SILHOUETTE_CARD_DROP_SHADOW =
  'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.22)) drop-shadow(0 2px 6px rgba(0, 0, 0, 0.28)) drop-shadow(0 4px 14px rgba(0, 0, 0, 0.2))'

export const SILHOUETTE_CARD_DROP_SHADOW_HOVER =
  'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.24)) drop-shadow(0 4px 10px rgba(0, 0, 0, 0.32)) drop-shadow(0 8px 20px rgba(0, 0, 0, 0.22))'

/** Inner card: clip + clear rectangular shadow. Outer wrap gets silhouette drop-shadow. */
export function dashboardCardShapeInnerStyle(shape: DashboardCardShape): CSSProperties {
  const clipPath = SHAPE_CLIP_PATH[shape]
  if (clipPath == null) return {}
  return {
    clipPath,
    borderRadius: 0,
    boxShadow: 'none',
    overflow: 'visible',
  }
}

/** Center title / subtitle / term under silhouette shapes (inline so it tracks JS reload like clip-path). */
export function dashboardCardShapeHeaderContentStyle(shape: DashboardCardShape): CSSProperties {
  if (shape === 'rounded') return {}
  return {textAlign: 'center'}
}

/** Block-level link so header text honors full card width + alignment under silhouettes. */
export function dashboardCardShapeLinkStyle(shape: DashboardCardShape): CSSProperties {
  if (shape === 'rounded') return {}
  return {display: 'block', textAlign: 'center'}
}

/** Layout-only props for the silhouette wrapper (shadow is merged in `DashboardCard`). */
export function dashboardCardShapeWrapStyle(shape: DashboardCardShape): CSSProperties | undefined {
  if (shape === 'rounded') return undefined
  return {
    display: 'inline-block',
    verticalAlign: 'top',
  }
}
