import { readFile, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'

export class Vestfor {
  private cookie: string = ''
  private baseUrl: string
  private running: boolean = false
  private address: string
  // private addressInfo: VestforAddressInfo | null = null
  private promise?: Promise<void>
  private resolvePromise?: () => void
  private resolveSleepPromise?: () => void
  private data: TrashCollectionData
  private filePath: string

  constructor(
    address: string,
    filePath: string = 'vestfor.json',
    baseUrl: string = 'https://selvbetjening.vestfor.dk'
  ) {
    this.address = address
    this.baseUrl = baseUrl
    this.filePath = filePath
    this.data = { Collections: [], LastUpdated: new Date(0) }
    console.log(`Vestfor initialized with address: ${address}, filePath: ${filePath}, baseUrl: ${baseUrl}`)
  }

  public async start() {
    this.running = true
    this.promise = new Promise((resolve) => {
      this.resolvePromise = resolve
    })

    return new Promise<void>((resolve) => {
      void this.run(resolve)
    })
  }

  public async stop(): Promise<void> {
    if (this.running && this.promise) {
      if (this.resolveSleepPromise) {
        this.resolveSleepPromise()
      }
      this.running = false
      await this.promise
    }
  }

  public getData(): TrashCollection[] {
    return this.data?.Collections ?? []
  }

  private async loadData(): Promise<void> {
    if (existsSync(this.filePath)) {
      let data: string | undefined
      try {
        data = await readFile(this.filePath, 'utf-8')
      } catch (err) {
        console.log(`Error reading ${this.filePath}:`, err)
        return
      }
      console.log(`Loaded data from ${this.filePath}:`, data)

      try {
        const parsedData = JSON.parse(data)

        if (parsedData.Collections && parsedData.LastUpdated) {
          if (Array.isArray(parsedData.Collections)) {
            this.data.Collections = parsedData.Collections.map((item: TrashCollection) => ({
              type: item.type,
              date: new Date(item.date)
            }))
          }
          if (
            parsedData.LastUpdated.toString().match(
              /20[0-9]{2}-[01][0-9]-[0123][0-9]T[012][0-9](:[0-5][0-9]){2}.[0-9]{3}Z/
            )
          ) {
            this.data.LastUpdated = new Date(parsedData.LastUpdated)
          }
        }
      } catch (parseErr) {
        console.log(`Error parsing ${this.filePath}:`, parseErr)
        this.data = { Collections: [], LastUpdated: new Date(0) }
      }
    }
  }

  private async run(ready: () => void): Promise<void> {
    await this.loadData()

    while (this.running) {
      const compareDate = new Date()
      compareDate.setDate(compareDate.getDate() - 7)

      if (this.data && this.data.LastUpdated < compareDate) {
        const addresses = await this.fetchAddressInfo()
        console.log('addresses', addresses)

        if (addresses.length > 0) {
          await this.setAddress(addresses[0])
          await this.fetchTrashCollection()
        }
      }

      ready()
      await this.sleep(1000 * 60 * 60 * 12)
    }

    if (this.resolvePromise) {
      this.resolvePromise()
    }
  }

  private async fetchAddressInfo(): Promise<VestforAddressInfo[]> {
    const res = await fetch(
      `${this.baseUrl}/Adresse/AddressByName?term=${encodeURIComponent(this.address)}&numberOfResults=50`
    )

    try {
      const text = await res.text()
      const addresses = JSON.parse(text) as VestforAddressInfo[]
      return addresses
    } catch (err) {
      console.error('Error parsing address info response:', err)
      return []
    }
  }

  private async setAddress(address: VestforAddressInfo): Promise<void> {
    this.data.AddressInfo = address

    const params = new URLSearchParams()

    params.append('address-display', address.FuldtVejnavn)
    params.append('address-search', `${address.Vejnavn}, ${address.Postnr} ${address.By}`)
    params.append('kommunekode-search', address.Kommunekode)
    params.append('number-search', address.Husnr)
    params.append('address-selected-vejkode', address.Vejkode.toString())
    params.append('address-selected-id', address.Id)
    const res = await fetch(`${this.baseUrl}/AdresseSoegning/AdresseSoegning?${params}`)
    console.log('headers', res.headers)
    this.cookie = res.headers.get('set-cookie') || ''
  }

  private async fetchTrashCollection(): Promise<void> {
    const params = new URLSearchParams()
    const today = new Date()
    const laterTime = new Date(today.getTime() + 1000 * 60 * 60 * 24 * 60)

    params.append('start', today.toISOString().split('T')[0])
    params.append('end', laterTime.toISOString().split('T')[0])
    console.log('Fetching trash collection with params:', params.toString())
    try {
      const res = await fetch(`${this.baseUrl}/Adresse/ToemmeDates?${params}`, {
        headers: {
          Cookie: this.cookie
        }
      })
      const resJson = await res.json()
      if (Array.isArray(resJson) && resJson.length > 0) {
        const collections = resJson.map<TrashCollection>((item) => ({
          type: item.title,
          date: new Date(item.start)
        }))

        this.data.Collections = collections
        this.data.LastUpdated = new Date()

        try {
          await writeFile(this.filePath, JSON.stringify(this.data))
        } catch (err) {
          console.log(`Error writing ${this.filePath}:`, err)
        }
      }
    } catch (err) {
      console.log('Error fetching trash collection:', err)
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => {
      this.resolveSleepPromise = resolve
      setTimeout(resolve, ms)
    })
  }
}

export type VestforHeaders = {
  Cookie: string
}

export type TrashCollection = {
  type: string
  date: Date
}

export type VestforAddressInfo = {
  Id: string
  FuldtVejnavn: string
  Vejnavn: string
  Husnr: string
  By: string
  Kommunekode: string
  Postnr: string
  Postdistrikt: string
  Etage: string | null
  Vejkode: number
  KoordinatNord: number
  KoordinatOest: number
}

export type TrashCollectionData = {
  Collections: TrashCollection[]
  LastUpdated: Date
  AddressInfo?: VestforAddressInfo
}
