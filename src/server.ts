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
    res.status(200).json(vestfor.getData())
  })

  app.listen(port, () => {
    console.log(`Server is running on port ${port}`)
  })
}
