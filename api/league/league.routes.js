import express from 'express'
import { getLeagues, getLeague, getTeam, getTeamByLeague } from './league.controller.js'

const router = express.Router()

router.get('/', getLeagues)
router.get('/:leagueId', getLeague)
router.get('/:leagueId/:teamId', getTeamByLeague)

export const leagueRoutes = router