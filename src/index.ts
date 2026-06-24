import { startServer } from './server'
import { Vestfor } from './vestfor'
import { VestforTestServer } from './test/vestforserver'

async function main() {
  const address = process.env.ADDRESS
  const port = process.env.PORT ? parseInt(process.env.PORT) : 3000
  let vestfor: Vestfor
  if (address) {
    vestfor = new Vestfor(address)
  } else {
    const testServer = new VestforTestServer()
    await testServer.start()
    vestfor = new Vestfor('test', testServer.url)
    console.log('ADDRESS environment variable is not set. Starting test environment...')
  }
  await Promise.all([startServer(vestfor, port), vestfor.start()])
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
