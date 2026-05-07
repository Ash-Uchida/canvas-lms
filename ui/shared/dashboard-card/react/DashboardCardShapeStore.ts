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

import {create} from 'zustand'
import {persist, createJSONStorage} from 'zustand/middleware'

// The set of shapes a user can pick for their dashboard course cards.
// Add new shapes here and add a matching `.ic-DashboardCard--shape-{name}`
// rule in app/stylesheets/bundles/dashboard_card.scss.
export const DASHBOARD_CARD_SHAPES = ['rounded', 'square', 'soft', 'pill'] as const

export type DashboardCardShape = (typeof DASHBOARD_CARD_SHAPES)[number]

export const DEFAULT_DASHBOARD_CARD_SHAPE: DashboardCardShape = 'rounded'

export const isDashboardCardShape = (value: unknown): value is DashboardCardShape =>
  typeof value === 'string' &&
  (DASHBOARD_CARD_SHAPES as readonly string[]).includes(value)

interface DashboardCardShapeState {
  shape: DashboardCardShape
  setShape: (shape: DashboardCardShape) => void
  reset: () => void
}

// localStorage key. Scoped per-user so multiple Canvas accounts on the same
// browser don't trample each other's preference.
const storageKey = (): string => {
  const userId =
    (typeof window !== 'undefined' && (window as any).ENV?.current_user_id) || 'anonymous'
  return `canvas:dashboard-card-shape:${userId}`
}

export const useDashboardCardShapeStore = create<DashboardCardShapeState>()(
  persist(
    set => ({
      shape: DEFAULT_DASHBOARD_CARD_SHAPE,
      setShape: shape => set({shape}),
      reset: () => set({shape: DEFAULT_DASHBOARD_CARD_SHAPE}),
    }),
    {
      name: storageKey(),
      storage: createJSONStorage(() => localStorage),
      // Drop persisted values that aren't a known shape (e.g. after a rename
      // or removal of a shape variant).
      migrate: persistedState => {
        const candidate = (persistedState as DashboardCardShapeState | undefined)?.shape
        return {
          shape: isDashboardCardShape(candidate) ? candidate : DEFAULT_DASHBOARD_CARD_SHAPE,
        } as DashboardCardShapeState
      },
      version: 1,
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
