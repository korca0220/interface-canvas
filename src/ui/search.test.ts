import { describe, expect, it } from 'vitest'
import { exampleDoc } from '../model/example'
import { searchInterfaces } from './search'

const names = (q: string) => searchInterfaces(exampleDoc().interfaces, q).map((h) => h.node.name)

describe('searchInterfaces', () => {
  it('빈 검색어는 전체를 이름순으로', () => {
    expect(names('')).toEqual(['AuthApi', 'AuthFailure', 'AuthRepository', 'AuthRepositoryImpl', 'LoginUseCase', 'User'])
  })
  it('정확히 일치 > 접두사 > 단어 시작', () => {
    expect(names('user')[0]).toBe('User')
    expect(names('authrepo')).toEqual(['AuthRepository', 'AuthRepositoryImpl'])
    expect(names('usecase')).toEqual(['LoginUseCase'])
  })
  it('약어와 멤버 이름', () => {
    expect(names('arimpl')).toEqual(['AuthRepositoryImpl'])
    const hit = searchInterfaces(exampleDoc().interfaces, 'postLog')[0]
    expect(hit.node.name).toBe('AuthApi')
    expect(hit.match).toBe('postLogin')
  })
})
