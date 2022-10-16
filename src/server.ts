// imports
import express, { Express } from 'express'
import useRouter from './users.routes'
import voucherRoutes from './vouchers.routes'
import cors from 'cors'

const PORT = 8888
const app: Express = express()
app.use(cors())

app.use(express.json())
app.use(useRouter)
app.use(voucherRoutes)

app.listen(PORT, () => {
  console.log(`listening on port ${PORT}`)
})
