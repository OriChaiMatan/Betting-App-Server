import { _leagueService } from "./league.service.js"
import { logger } from "../../services/logger.service.js"

export async function getLeagues(req, res){
    try {
        const leagues = await _leagueService.query()
        res.send(leagues)
    } catch (err) {
        logger.error(`Cannot get leagues`, err)
        res.status(400).send(`Cannot'nt get leagues`)
    }
}

export async function getLeague(req, res) {
    try {
        const leagueId = req.params.leagueId
        const league = await _leagueService.getLeagueById(leagueId)
        res.send(league)
    } catch (err) {
        logger.error(`Cannot get league`, err)
        res.status(400).send(`Cannot get league`)
    }
}

export async function getTeam(req, res) {
    try {
        const teamId = req.params.teamId
        const team = await _leagueService.getTeamById(teamId)
        res.send(team)
    } catch (err) {
        logger.error(`Cannot get team`, err)
        res.status(400).send(`Cannot get team`)
    }
}
