import express, { Express, json } from 'express'
import { Vestfor } from './vestfor'

export async function startServer(vestfor: Vestfor, port: number): Promise<void> {
  const app: Express = express()

  app.use(json())
  app.use((_req, res, next) => {
    res.set('Cache-Control', 'no-store')
    res.set('Access-Control-Allow-Origin', '*')
    res.set('Access-Control-Allow-Methods', '*')
    next()
  })

  app.get('/', (_, res) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    res.status(200).json(vestfor.getData().filter((collection) => collection.date >= today))
  })

  app.listen(port, () => {
    console.log(`Server is running on port ${port}`)
  })
}
