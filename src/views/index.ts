import type { ComponentType } from 'react'
import Overview from './Overview'
import DefenseLayers from './DefenseLayers'

export interface ViewDef {
  id: string
  title: string
  component: ComponentType
}

// Register each visualization here. Add a new view by creating
// src/views/<Name>.tsx (or a folder) and appending an entry below.
export const views: ViewDef[] = [
  { id: 'overview', title: 'Overview', component: Overview },
  { id: 'defense-layers', title: 'Defense in depth', component: DefenseLayers },
]
