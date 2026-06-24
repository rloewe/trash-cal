export class Vestfor {
  private data: TrashCollection[] = []
  private cookie: string = ''
  private baseUrl: string
  private running: boolean = false
  private address: string
  // private addressInfo: VestforAddressInfo | null = null
  private promise?: Promise<void>
  private resolvePromise?: () => void
  private resolveSleepPromise?: () => void

  constructor(address: string, baseUrl: string = 'https://selvbetjening.vestfor.dk') {
    this.address = address
    this.baseUrl = baseUrl
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
    return this.data
  }

  private async run(ready: () => void): Promise<void> {
    while (this.running) {
      const addresses = await this.fetchAddressInfo()
      console.log('addresses', addresses)
      if (addresses.length > 0) {
        await this.setAddress(addresses[0])
        await this.fetchTrashCollection()
      }
      ready()
      await this.sleep(1000 * 60 * 60 * 24 * 7)
    }
    if (this.resolvePromise) {
      this.resolvePromise()
    }
  }

  private async fetchAddressInfo(): Promise<VestforAddressInfo[]> {
    const res = await fetch(
      `${this.baseUrl}/Adresse/AddressByName?term=${encodeURIComponent(this.address)}&numberOfResults=50`
    )

    const text = await res.text()
    const addresses = JSON.parse(text) as VestforAddressInfo[]
    return addresses
  }

  private async setAddress(address: VestforAddressInfo) {
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

  private async fetchTrashCollection() {
    const params = new URLSearchParams()
    const today = new Date()
    const laterTime = new Date(today.getTime() + 1000 * 60 * 60 * 24 * 60)

    params.append('start', today.toISOString().split('T')[0])
    params.append('end', laterTime.toISOString().split('T')[0])
    const res = await fetch(`${this.baseUrl}/Adresse/ToemmeDates?${params}`, {
      headers: {
        Cookie: this.cookie
      }
    })
    const resJson = await res.json()
    if (Array.isArray(resJson)) {
      this.data = resJson.map<TrashCollection>((item) => ({
        type: item.title,
        date: new Date(item.start)
      }))
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

type TrashCollection = {
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
