// 문서 모델. 캔버스·패널·내보내기는 모두 이 모델을 보여주거나 변환한다.
// SPEC.md의 타입을 따르되, 손실 없는 왕복을 위해 선택 필드 두 개를 추가했다
// (Doc.memo, Param.defaultValue). 자세한 이유는 README의 "설계 결정" 참고.

export type InterfaceKind = 'interface' | 'abstract' | 'class' | 'enum' | 'model'

export type RelationType = 'implements' | 'extends' | 'depends' | 'uses' | 'creates'

export type Field = {
  name: string
  type: string
  nullable?: boolean
}

export type Param = {
  name: string
  type: string
  named?: boolean
  required?: boolean
  defaultValue?: string
}

export type Method = {
  name: string
  params: Param[]
  returns: string
  isAsync?: boolean
}

export type InterfaceNode = {
  id: string
  name: string
  kind: InterfaceKind
  fields: Field[]
  methods: Method[]
  memo: string
  color?: string
  position: { x: number; y: number }
}

export type Relation = {
  id: string
  from: string
  to: string
  type: RelationType
  label?: string
}

export type Doc = {
  version: 1
  name: string
  memo?: string
  interfaces: InterfaceNode[]
  relations: Relation[]
}

export const KINDS: InterfaceKind[] = ['interface', 'abstract', 'class', 'enum', 'model']

export const RELATION_TYPES: RelationType[] = ['implements', 'extends', 'depends', 'uses', 'creates']

export const NODE_COLORS = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6', '#64748b']
