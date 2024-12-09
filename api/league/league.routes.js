import express from 'express'
import { getLeagues, getLeague, getTeam } from './league.controller.js'

const router = express.Router()

router.get('/', getLeagues)
router.get('/:leagueId', getLeague)
router.get('/:leagueId/:teamId', getTeam)

export const leagueRoutes = router