import type { Edge, Node } from '@xyflow/react'
import type { InterfaceNode, Relation } from '../model/types'

export type IfaceFlowNode = Node<{ iface: InterfaceNode; highlighted?: boolean }, 'iface'>
export type RelationFlowEdge = Edge<{ relation: Relation; offset: number }, 'relation'>
