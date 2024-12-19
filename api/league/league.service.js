import { utilService } from "../../services/util.service.js"
import { logger } from "../../services/logger.service.js"
import { dbService } from "../../services/db.service.js"
import mongodb from 'mongodb'
const {ObjectId} = mongodb

const collectionName = 'leagues'

export const _leagueService = {
    query,
    getLeagueById,
    getTeamById,
    getTeamByLeagueAndTeamId
}

async function query() {
    try {
        const criteria = _buildCriteria()
        const collection = await dbService.getCollection(collectionName)
        const leagueCursor = await collection.find(criteria)

        const leagues = await leagueCursor.toArray()
        return leagues
    } catch (err) {
        logger.error(err)
        throw err
    }
}

async function getLeagueById(leagueId) {
    try {
        const collection = await dbService.getCollection(collectionName)
        const league = collection.findOne({ league_id: leagueId })
        if (!league) throw `Couldn't find league with _id ${leagueId}`
        return league
    } catch (err) {
        logger.error(`while finding stay ${leagueId}`, err)
        throw err
    }
}

async function getTeamById(teamId) {
    try {
        const collection = await dbService.getCollection(collectionName)
        const league = await collection.findOne({
            "league_teams.team_key": teamId, // Match the team_key in the league_teams array
        })
        if (!league) {
            throw new Error(`Team with team_key ${teamId} not found in any league`)
        }
        const team = league.league_teams.find(team => team.team_key === teamId)
        if (!team) {
            throw new Error(`Team with team_key ${teamId} was not found`)
        }
        return team
    } catch (err) {
        logger.error(`Error finding team with team_key ${teamId}`, err)
        throw err
    }
}

async function getTeamByLeagueAndTeamId(leagueId, teamId) {
    try {
        const collection = await dbService.getCollection(collectionName);

        // Find the league with the given leagueId
        const league = await collection.findOne({
            "league_id": leagueId, // Match the league ID
            "league_teams.team_key": teamId // Ensure the team is part of the league
        });

        if (!league) {
            throw new Error(`Team with team_key ${teamId} not found in league with league_id ${leagueId}`);
        }

        // Find the specific team in the league_teams array
        const team = league.league_teams.find(team => team.team_key === teamId);

        if (!team) {
            throw new Error(`Team with team_key ${teamId} not found in league with league_id ${leagueId}`);
        }

        return team;
    } catch (err) {
        logger.error(`Error finding team with team_key ${teamId} in league with league_id ${leagueId}`, err);
        throw err;
    }
}



function _buildCriteria() {
    const criteria = {}
    return criteria
}