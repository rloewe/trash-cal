import { Server, createServer } from 'http'
import { AddressInfo } from 'net'

export class VestforTestServer {
  private server: Server
  private cookieAddress: Record<string, string> = {}
  public url: string = ''

  constructor() {
    this.server = createServer({}, (req, res) => {
      if (!req.url) {
        res.statusCode = 404

        return res.end()
      }

      const parsedUrl = new URL(req.url, 'http://localhost')
      const pathname = parsedUrl.pathname
      const queryParams = parsedUrl.searchParams
      if (req.method === 'GET') {
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
            return res.end(
              JSON.stringify([
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
              ])
            )
          } else {
            return res.end(JSON.stringify([]))
          }
        }
        if (pathname === '/Adresse/AddressByName') {
          res.statusCode = 200
          if (queryParams.get('term') !== '' && queryParams.get('numberOfResults') !== '') {
            return res.end(
              JSON.stringify([
                {
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
              ])
            )
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
    })

    await new Promise<void>((resolve) => this.server.listen(0, resolve))
  }

  public async stop(): Promise<void> {
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
}
