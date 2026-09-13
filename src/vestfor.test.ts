import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { VestforTestServer } from './test/vestforserver'
import { Vestfor } from './vestfor'
import { existsSync } from 'node:fs'

describe('Vestfor', () => {
  const filePath = 'vestfor.json'
  const server = new VestforTestServer(filePath)

  beforeAll(async () => {
    await server.start()
  })

  beforeEach(async () => {
    await server.reset()
  })

  afterAll(async () => {
    await server.stop()
  })

  it('gets data', async () => {
    const vestfor = new Vestfor('test', filePath, server.url)
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

    expect(server.getWasCalled()).toBe(true)
    expect(existsSync(filePath)).toBe(true)

    await vestfor.stop()
  }, 50_000)

  it('uses cached data if it is not too old', async () => {
    server.writeDataFile()
    const vestfor = new Vestfor('test', filePath, server.url)
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

    expect(server.getWasCalled()).toBe(false)
    expect(existsSync(filePath)).toBe(true)

    await vestfor.stop()
  })

  it('does not use cached data if it is too old', async () => {
    const oldDate = new Date(Date.now() - 1000 * 60 * 60 * 24 * 8) // 8 days ago
    await server.writeDataFile(oldDate)
    const vestfor = new Vestfor('test', filePath, server.url)
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

    expect(server.getWasCalled()).toBe(true)
    expect(existsSync(filePath)).toBe(true)

    await vestfor.stop()
  })

  it('does not crash if it fails', async () => {
    server.setShouldFail(true)
    const vestfor = new Vestfor('test', filePath, server.url)
    await vestfor.start()
    const data = vestfor.getData()
    expect(data).toEqual([])
    await vestfor.stop()
  })
})
