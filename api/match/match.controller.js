import { _matchService } from "./match.service.js"
import { logger } from "../../services/logger.service.js"

export async function getFutureMatches(req, res){
    try {
        const futureMatches = await _matchService.getFutureGames()
        res.send(futureMatches)
    } catch (err) {
        logger.error(`Cannot get future matches`, err)
        res.status(400).send(`Cannot'nt get future matches`)
    }
}

export async function getPastMatches(req, res){
    try {
        const filterBy = {
            match_league: req.query.match_league || '',
            match_team: req.query.match_team || '',
            match_date: req.query.match_date || '',
            // limit: req.query.limit || 10,
            // offset: req.query.offset || 0
        }
        const pastMatches = await _matchService.getPastGames(filterBy)
        res.json(pastMatches)
    } catch (err) {
        logger.error(`Cannot get past matches`, err)
        res.status(400).send(`Cannot'nt get past matches`)
    }
}

export async function getPastMatch(req, res) {
    try {
        const pastMatchId = req.params.pastMatchId
        const pastMatch = await _matchService.getPastMatchById(pastMatchId)
        res.send(pastMatch)
    } catch (err) {
        loggerService.error(`Cannot get past match`, err)
        res.status(400).send(`Cannot get past match`)
    }
}

export async function getFutureMatch(req, res) {
    try {
        const futureMatchId = req.params.futureMatchId
        const futureMatch = await _matchService.getFutureMatchById(futureMatchId)
        res.send(futureMatch)
    } catch (err) {
        loggerService.error(`Cannot get future match`, err)
        res.status(400).send(`Cannot get future match`)
    }
}
