import express from "express"
import path from "path"
import cors from "cors"

import { logger } from "./services/logger.service.js"

const app = express()

const PORT = process.env.PORT || 5001

const corsOptions = {
    origin: [
        'http://127.0.0.1:5001',
        'http://localhost:5001',
        'http://127.0.0.1:5173',
        'http://localhost:5173',
    ],
    credentials: true
}

app.use(cors(corsOptions))
app.use(express.json())

import { matchRoutes } from "./api/match/match.routes.js"
import { leagueRoutes } from "./api/league/league.routes.js"

app.use('/api/match', matchRoutes)
app.use('/api/league', leagueRoutes)


app.get("/**", (req, res) => {
    res.sendFile(path.resolve('public/index.html'))
})

app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`)
})
