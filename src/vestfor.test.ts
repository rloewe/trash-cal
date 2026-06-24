import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { VestforTestServer } from './test/vestforserver'
import { Vestfor } from './vestfor'

describe('Vestfor', () => {
  const server = new VestforTestServer()

  beforeAll(async () => {
    await server.start()
  })

  afterAll(async () => {
    await server.stop()
  })

  it('gets data', async () => {
    const vestfor = new Vestfor('test', server.url)
    await vestfor.start()
    const data = vestfor.getData()
    expect(data).toEqual([
      {
        type: 'Mad/Rest affald',
        date: new Date('2026-06-23')
      },
      {
        type: 'Haveaffald',
        date: new Date('2026-06-26')
      },
      {
        type: 'Papir/Plast & MDK',
        date: new Date('2026-06-30')
      },
      {
        type: 'Mad/Rest affald',
        date: new Date('2026-06-30')
      }
    ])
    await vestfor.stop()
  }, 50_000)
})
