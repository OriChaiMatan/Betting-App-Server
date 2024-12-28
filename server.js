import express from "express"
import { createServer } from "node:http";
import path from "path"
import cors from "cors"
import cookieParser from "cookie-parser";

import { logger } from "./services/logger.service.js"

import { config } from "dotenv"
import "dotenv/config.js"

config()

const app = express()
const server = createServer(app)

const PORT = process.env.PORT || 5001

if (process.env.NODE_ENV === 'production') {
    console.log('production')
    app.use(express.static(path.resolve('public')))
} else {
    console.log('development')
    const corsOptions = {
        origin: [
            'http://127.0.0.1:5001',
            'http://localhost:5001',
            'http://127.0.0.1:5173',
            'http://localhost:5173',
            'https://betting-app-server-vv19.onrender.com',
        ],
        credentials: true
    }
    app.use(cors(corsOptions));
}

// const corsOptions = {
//     origin: [
//         'http://127.0.0.1:5001',
//         'http://localhost:5001',
//         'http://127.0.0.1:5173',
//         'http://localhost:5173',
//     ],
//     credentials: true
// }

// app.use(cors(corsOptions))
app.use(express.json())

import { authRoutes } from "./api/auth/auth.routes.js"
import { userRoutes } from "./api/user/user.routes.js"
import { matchRoutes } from "./api/match/match.routes.js"
import { leagueRoutes } from "./api/league/league.routes.js"
import { setupSocketAPI } from "./services/socket.service.js"

import { setupAsyncLocalStorage } from "./middlewares/setupAls.middleware.js"
app.all('*', setupAsyncLocalStorage)

app.use('/api/auth', authRoutes)
app.use('/api/user', userRoutes)
app.use('/api/match', matchRoutes)
app.use('/api/league', leagueRoutes)

setupSocketAPI(server)

app.get("/**", (req, res) => {
    res.sendFile(path.resolve('public/index.html'))
})


import { fetchData } from "./services/football-api.service.js"
server.listen(PORT, async () => {
    logger.info(`Server running on port ${PORT}`)

    // try {
    //     await fetchData()
    //     logger.info('Successfully fetched and calculated football data.')
    // } catch (error) {
    //     logger.error('Error fetching and calculating football data:', error)
    // }
})
