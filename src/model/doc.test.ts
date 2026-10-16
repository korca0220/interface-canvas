import { describe, expect, it } from 'vitest'
import { DocFormatError, normalizeDoc, serializeDoc } from './doc'
import { exampleDoc } from './example'

describe('normalizeDoc', () => {
  it('예시 문서는 직렬화 왕복 후 동일하다', () => {
    const doc = exampleDoc()
    expect(normalizeDoc(JSON.parse(serializeDoc(doc)))).toEqual(doc)
  })

  it('버전이 다르면 거부한다', () => {
    expect(() => normalizeDoc({ version: 2, interfaces: [], relations: [] })).toThrow(DocFormatError)
    expect(() => normalizeDoc('nope')).toThrow(DocFormatError)
  })

  it('누락 필드는 기본값으로 채우고 끊어진 관계는 버린다', () => {
    const doc = normalizeDoc({
      version: 1,
      interfaces: [{ id: 'a', name: 'A' }, { id: 'b', kind: 'weird' }, { id: 'a' }],
      relations: [
        { id: 'r1', from: 'a', to: 'b', type: 'implements' },
        { id: 'r2', from: 'a', to: 'missing', type: 'uses' },
        { id: 'r3', from: 'a', to: 'b', type: '???' },
      ],
    })
    expect(doc.name).toBe('Untitled')
    expect(doc.interfaces).toHaveLength(2)
    expect(doc.interfaces[1]).toMatchObject({ name: 'Unnamed', kind: 'interface', fields: [], position: { x: 0, y: 0 } })
    expect(doc.relations.map((r) => r.id)).toEqual(['r1', 'r3'])
    expect(doc.relations[1].type).toBe('depends')
  })
})
