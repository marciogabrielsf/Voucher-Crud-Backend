// imports
import express, { Express } from 'express'
import useRouter from './users.routes'

const PORT = 3000
const app: Express = express()

app.use(express.json())
app.use(useRouter)

app.listen(PORT, () => {
  console.log(`listening on port ${PORT}`)
})
