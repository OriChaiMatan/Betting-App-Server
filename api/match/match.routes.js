import express from 'express'
import { getFutureMatch, getFutureMatches, getPastMatch, getPastMatches } from './match.controller.js'

const router = express.Router()

router.get('/future-match', getFutureMatches)
router.get('/future-match/:futureMatchId', getFutureMatch)
router.get('/past-match', getPastMatches)
router.get('/past-match/:pastMatchId', getPastMatch)

export const matchRoutes = router