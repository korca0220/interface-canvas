import { beforeEach, describe, expect, it } from 'vitest'
import { emptyDoc } from './doc'
import { guessRelationType, useDocStore } from './store'
import { createInterface } from './doc'

const s = () => useDocStore.getState()

describe('doc store history', () => {
  beforeEach(() => s().loadDoc(emptyDoc('t')))

  it('undo/redo로 노드 추가를 되돌린다', () => {
    const id = s().addInterface({ name: 'A' })
    expect(s().doc.interfaces).toHaveLength(1)
    s().undo()
    expect(s().doc.interfaces).toHaveLength(0)
    expect(s().selection.nodes).not.toContain(id)
    s().redo()
    expect(s().doc.interfaces[0].name).toBe('A')
  })

  it('같은 coalesce 키의 연속 편집은 한 번에 되돌린다', () => {
    const id = s().addInterface({ name: 'A' })
    s().updateInterface(id, { memo: 'h' }, { coalesce: 'memo' })
    s().updateInterface(id, { memo: 'he' }, { coalesce: 'memo' })
    s().updateInterface(id, { memo: 'hey' }, { coalesce: 'memo' })
    s().undo()
    expect(s().doc.interfaces[0].memo).toBe('')
  })

  it('드래그 제스처는 끝날 때 한 칸만 기록한다', () => {
    const id = s().addInterface({ name: 'A' })
    const before = s().past.length
    s().beginGesture()
    s().moveInterfaces({ [id]: { x: 10, y: 10 } })
    s().moveInterfaces({ [id]: { x: 20, y: 30 } })
    s().endGesture()
    expect(s().past.length).toBe(before + 1)
    s().undo()
    expect(s().doc.interfaces[0].position).toEqual({ x: 0, y: 0 })
  })

  it('움직이지 않은 제스처는 기록하지 않는다', () => {
    s().addInterface({ name: 'A' })
    const before = s().past.length
    s().beginGesture()
    s().endGesture()
    expect(s().past.length).toBe(before)
  })

  it('노드를 지우면 연결된 관계도 지운다', () => {
    const a = s().addInterface({ name: 'A' })
    const b = s().addInterface({ name: 'B' })
    s().addRelation(a, b, 'depends')
    s().deleteItems([a], [])
    expect(s().doc.relations).toHaveLength(0)
  })

  it('자기 자신 연결과 중복 관계를 막는다', () => {
    const a = s().addInterface({ name: 'A' })
    const b = s().addInterface({ name: 'B' })
    expect(s().addRelation(a, a)).toBeNull()
    expect(s().addRelation(a, b, 'uses')).not.toBeNull()
    expect(s().addRelation(a, b, 'uses')).toBeNull()
  })

  it('이름이 겹치면 숫자를 붙인다', () => {
    s().addInterface({ name: 'A' })
    s().addInterface({ name: 'A' })
    expect(s().doc.interfaces.map((n) => n.name)).toEqual(['A', 'A2'])
  })
})

describe('duplicateInterfaces', () => {
  beforeEach(() => s().loadDoc(emptyDoc('t')))
  it('선택 노드와 그 사이의 관계를 복제하고 복제본을 선택한다', () => {
    const a = s().addInterface({ name: 'A' })
    const b = s().addInterface({ name: 'B' })
    s().addRelation(a, b, 'implements')
    const ids = s().duplicateInterfaces([a, b])
    expect(ids).toHaveLength(2)
    expect(s().doc.interfaces.map((n) => n.name)).toEqual(['A', 'B', 'ACopy', 'BCopy'])
    expect(s().doc.relations).toHaveLength(2)
    expect(s().doc.relations[1]).toMatchObject({ from: ids[0], to: ids[1], type: 'implements' })
    expect(s().selection.nodes).toEqual(ids)
    s().undo()
    expect(s().doc.interfaces).toHaveLength(2)
  })
})

describe('guessRelationType', () => {
  it('FooImpl → Foo(interface)는 implements', () => {
    const impl = createInterface({ name: 'AuthRepositoryImpl', kind: 'class' })
    const repo = createInterface({ name: 'AuthRepository', kind: 'interface' })
    expect(guessRelationType(impl, repo)).toBe('implements')
  })
  it('model 대상은 uses, 그 외는 depends', () => {
    const uc = createInterface({ name: 'LoginUseCase', kind: 'class' })
    expect(guessRelationType(uc, createInterface({ name: 'User', kind: 'model' }))).toBe('uses')
    expect(guessRelationType(uc, createInterface({ name: 'AuthRepository' }))).toBe('depends')
  })
})
