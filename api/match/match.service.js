import { utilService } from "../../services/util.service.js"

const futureMatches = utilService.readJsonFile('data/future-matches.json')
const pastMatches = utilService.readJsonFile('data/past-matches.json')

export const _matchService = {
    getPastGames,
    getFutureGames, 
    // getGamesByDate,
    getPastMatchById,
    getFutureMatchById,
}

async function getPastGames() {
    try {
        return pastMatches
    } catch (err) {
        throw err
    }
}

async function getFutureGames() {
    try {
        return futureMatches
    } catch (err) {
        throw err
    }
}

async function getPastMatchById(matchId) {
    try {
        const pastMatch = pastMatches.find(match => match.match_id === matchId)
        return pastMatch
    } catch (err) {
        throw err
    }
}

async function getFutureMatchById(matchId) {
    try {
        const futureMatch = futureMatches.find(match => match.match_id === matchId)
        return futureMatch
    } catch (err) {
        throw err
    }
}