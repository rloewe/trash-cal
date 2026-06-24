import express, { Express, json } from 'express'
import { Vestfor } from './vestfor'

export async function startServer(vestfor: Vestfor, port: number): Promise<void> {
  const app: Express = express()

  app.use(json())

  app.get('/', (_, res) => {
    res.status(200).json(vestfor.getData())
  })

  app.listen(port, () => {
    console.log(`Server is running on port ${port}`)
  })
}
