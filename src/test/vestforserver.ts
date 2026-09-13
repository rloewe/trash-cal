import { existsSync } from 'node:fs'
import { writeFile, rm } from 'node:fs/promises'
import { Server, createServer } from 'http'
import { AddressInfo } from 'net'
import { TrashCollection, TrashCollectionData, VestforAddressInfo } from '../vestfor'

export class VestforTestServer {
  private server: Server
  private cookieAddress: Record<string, string> = {}
  private wasCalled: boolean = false
  private shouldFail: boolean = false
  private filePath: string
  public url: string = ''
  private addressInfo: VestforAddressInfo = {
    Id: '845d2c8c-aaaa-e511-ffff-005056be6a4c',
    FuldtVejnavn: 'testvej 27, 1234 testby',
    Vejnavn: 'testvej',
    Husnr: '27',
    By: 'testby',
    Kommunekode: '123',
    Postnr: '1234',
    Postdistrikt: 'testby',
    Etage: null,
    Vejkode: 5137,
    KoordinatNord: 6172765.94,
    KoordinatOest: 719397.18
  }

  private collections = [
    {
      title: 'Mad/Rest affald',
      start: '2026-06-23',
      color: '#775223'
    },
    {
      title: 'Haveaffald',
      start: '2026-06-26',
      color: '#375223'
    },
    {
      title: 'Papir/Plast & MDK',
      start: '2026-06-30',
      color: '#249981'
    },
    {
      title: 'Mad/Rest affald',
      start: '2026-06-30',
      color: '#775223'
    }
  ]

  constructor(filePath: string = 'vestfor.json') {
    this.filePath = filePath
    this.server = createServer({}, (req, res) => {
      if (!req.url) {
        res.statusCode = 404

        return res.end()
      }

      const parsedUrl = new URL(req.url, 'http://localhost')
      const pathname = parsedUrl.pathname
      const queryParams = parsedUrl.searchParams
      if (this.shouldFail) {
        res.statusCode = 500
        return res.end('Internal Server Error')
      }
      if (req.method === 'GET') {
        this.wasCalled = true
        if (pathname === '/AdresseSoegning/AdresseSoegning') {
          res.statusCode = 200
          console.log(queryParams.toString())
          if (
            queryParams.has('address-display') &&
            queryParams.has('address-search') &&
            queryParams.has('kommunekode-search') &&
            queryParams.has('number-search') &&
            queryParams.has('address-selected-vejkode') &&
            queryParams.has('address-selected-id') &&
            queryParams.get('address-selected-id') === '845d2c8c-aaaa-e511-ffff-005056be6a4c'
          ) {
            const cookie = 'AcceptCookies=false;ASP.NET_SessionId=1234567890;'
            this.cookieAddress[cookie] = '845d2c8c-aaaa-e511-ffff-005056be6a4c'
            res.setHeader('set-cookie', cookie)
          }
          return res.end(JSON.stringify({}))
        }
        if (pathname === '/Adresse/ToemmeDates') {
          res.statusCode = 200
          if (this.cookieAddress[req.headers.cookie || ''] === '845d2c8c-aaaa-e511-ffff-005056be6a4c') {
            return res.end(JSON.stringify(this.collections))
          } else {
            return res.end(JSON.stringify([]))
          }
        }
        if (pathname === '/Adresse/AddressByName') {
          res.statusCode = 200
          if (queryParams.get('term') !== '' && queryParams.get('numberOfResults') !== '') {
            return res.end(JSON.stringify([this.addressInfo]))
          } else {
            return res.end(JSON.stringify([]))
          }
        }
      }

      res.statusCode = 404

      return res.end('Not Found')
    })
  }

  public async start(): Promise<void> {
    this.server.on('listening', () => {
      const a = this.server.address() as AddressInfo

      this.url = `http://127.0.0.1:${a.port}`
      console.log(`Test server is running at ${this.url}`)
    })

    await new Promise<void>((resolve) => this.server.listen(0, resolve))
  }

  public async stop(): Promise<void> {
    await this.removeFile()
    await new Promise<void>((resolve, reject) => {
      this.server.close((err) => {
        if (err) {
          reject(err)
        } else {
          this.server.removeAllListeners('listening')
          resolve()
        }
      })
    })
  }

  private async removeFile(): Promise<void> {
    try {
      if (existsSync(this.filePath)) {
        await rm(this.filePath)
      }
    } catch (err) {
      console.error(err)
    }
  }

  public async reset(): Promise<void> {
    this.wasCalled = false
    await this.removeFile()
  }

  public getWasCalled(): boolean {
    return this.wasCalled
  }

  public setShouldFail(shouldFail: boolean): void {
    this.shouldFail = shouldFail
  }

  public async writeDataFile(lastUpdate: Date = new Date()): Promise<void> {
    try {
      const data: TrashCollectionData = {
        Collections: this.collections.map<TrashCollection>((item) => ({
          type: item.title,
          date: new Date(item.start)
        })),
        LastUpdated: lastUpdate,
        AddressInfo: this.addressInfo
      }
      await writeFile(this.filePath, JSON.stringify(data))
    } catch (err) {
      console.error(err)
    }
  }
}
