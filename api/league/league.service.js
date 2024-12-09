import { utilService } from "../../services/util.service.js"

const leagues = utilService.readJsonFile('data/leagues.json')

export const _leagueService = {
    query,
    getLeagueById,
    getTeamById
}

async function query() {
    try {
        return leagues
    } catch (err) {
        throw err
    }
}


async function getLeagueById(leagueId) {
    try {
        const league = leagues.find(league => league.league_id === leagueId)
        return league
    } catch (err) {
        throw err
    }
}

async function getTeamById(teamId) {
    try {
        for (const league of leagues) {
            const team = league.league_teams.find((team) => team.team_key === teamId)
            if (team) {
                return team
            }
        }
    } catch (err) {
        throw err
    }
}