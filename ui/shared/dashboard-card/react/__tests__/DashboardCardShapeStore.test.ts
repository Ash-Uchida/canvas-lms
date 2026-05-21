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

import fakeENV from '@canvas/test-utils/fakeENV'
import {
  DASHBOARD_CARD_SHAPE_CHANGED_EVENT,
  DASHBOARD_CARD_SHAPES,
  DEFAULT_DASHBOARD_CARD_SHAPE,
  dashboardCardShapeClassName,
  dashboardCardShapeHeaderContentStyle,
  dashboardCardShapeInnerStyle,
  dashboardCardShapeLinkStyle,
  dashboardCardShapeWrapStyle,
  isDashboardCardShape,
  useDashboardCardShapeStore,
} from '../DashboardCardShapeStore'

describe('DashboardCardShapeStore helpers', () => {
  it('validates supported shapes only', () => {
    for (const shape of DASHBOARD_CARD_SHAPES) {
      expect(isDashboardCardShape(shape)).toBe(true)
    }
    expect(isDashboardCardShape('classic')).toBe(false)
    expect(isDashboardCardShape(null)).toBe(false)
    expect(isDashboardCardShape(42)).toBe(false)
  })

  it('maps shape to ic-DashboardCard modifier class', () => {
    expect(dashboardCardShapeClassName('star')).toBe('ic-DashboardCard--shape-star')
  })

  it('returns empty inner style for rounded default', () => {
    expect(dashboardCardShapeInnerStyle('rounded')).toEqual({})
  })

  it('returns clip-path for silhouette shapes', () => {
    const circle = dashboardCardShapeInnerStyle('circle')
    expect(circle.clipPath).toContain('circle(')
    expect(circle.boxShadow).toBe('none')
  })

  it('centers header content and link for non-rounded shapes', () => {
    expect(dashboardCardShapeHeaderContentStyle('cat')).toEqual({textAlign: 'center'})
    expect(dashboardCardShapeLinkStyle('cat')).toMatchObject({
      display: 'block',
      textAlign: 'center',
    })
    expect(dashboardCardShapeWrapStyle('cat')).toMatchObject({display: 'inline-block'})
  })
})

describe('useDashboardCardShapeStore', () => {
  beforeEach(() => {
    fakeENV.setup({current_user_id: 99})
    localStorage.clear()
    useDashboardCardShapeStore.getState().reset()
  })

  afterEach(() => {
    useDashboardCardShapeStore.getState().reset()
    localStorage.clear()
    fakeENV.teardown()
  })

  it('defaults to rounded', () => {
    expect(useDashboardCardShapeStore.getState().shape).toBe(DEFAULT_DASHBOARD_CARD_SHAPE)
  })

  it('updates shape for valid values', () => {
    useDashboardCardShapeStore.getState().setShape('star')
    expect(useDashboardCardShapeStore.getState().shape).toBe('star')
  })

  it('ignores invalid shape values', () => {
    useDashboardCardShapeStore.getState().setShape('circle')
    useDashboardCardShapeStore.getState().setShape('not-a-shape' as 'circle')
    expect(useDashboardCardShapeStore.getState().shape).toBe('circle')
  })

  it('dispatches change event when shape updates', () => {
    const handler = vi.fn()
    window.addEventListener(DASHBOARD_CARD_SHAPE_CHANGED_EVENT, handler)
    useDashboardCardShapeStore.getState().setShape('cat')
    expect(handler).toHaveBeenCalled()
    window.removeEventListener(DASHBOARD_CARD_SHAPE_CHANGED_EVENT, handler)
  })

  it('persists shape to user-scoped localStorage key', () => {
    useDashboardCardShapeStore.getState().setShape('star')
    const raw = localStorage.getItem('canvas-dashboard-card-shape-v2:99')
    expect(raw).toBeTruthy()
    expect(JSON.parse(raw!)).toEqual({state: {shape: 'star'}, version: 2})
  })
})
