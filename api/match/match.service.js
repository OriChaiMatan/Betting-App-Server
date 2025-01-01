import { utilService } from "../../services/util.service.js"
import { logger } from "../../services/logger.service.js"
import { dbService } from "../../services/db.service.js"
import mongodb from 'mongodb'
const {ObjectId} = mongodb

const PAGE_SIZE = 2

const previousMatchesCollectionName = 'previous-matches'
const futureMatchesCollectionName = 'future-matches'

export const _matchService = {
    getPastGames,
    getFutureGames,
    getPastMatchById,
    getFutureMatchById,
}

async function getPastGames(filterBy = {}) {
    try {
        const criteria = _buildCriteria(filterBy)
        const collection = await dbService.getCollection(previousMatchesCollectionName)
        const matchCursor = await collection.find(criteria)
        
        const previousMatches = await matchCursor.toArray()
        return previousMatches
    } catch (err) {
        logger.error(err)
        throw err
    }
}

async function getFutureGames(filterBy = {}) {
    try {
        const criteria = _buildCriteria(filterBy)
        const collection = await dbService.getCollection(futureMatchesCollectionName)
        const matchCursor = await collection.find(criteria)

        const futureMatches = await matchCursor.toArray()
        return futureMatches
    } catch (err) {
        logger.error(err)
        throw err
    }
}

async function getPastMatchById(matchId) {
    try {
        const collection = await dbService.getCollection(previousMatchesCollectionName)
        const pastMatch = collection.findOne({ match_id: matchId })
        if (!pastMatch) throw `Couldn't find league with _id ${matchId}`
        return pastMatch
    } catch (err) {
        logger.error(`while finding stay ${matchId}`, err)
        throw err
    }
}

async function getFutureMatchById(matchId) {
    try {
        const collection = await dbService.getCollection(futureMatchesCollectionName)
        const futureMatch = collection.findOne({ match_id: matchId })
        if (!futureMatch) throw `Couldn't find league with _id ${matchId}`
        return futureMatch
    } catch (err) {
        logger.error(`while finding stay ${matchId}`, err)
        throw err
    }
}

function _buildCriteria(filterBy) {
    const criteria = {};

    // Filter by league name
    if (filterBy.match_league) {
        criteria.league_name = { $regex: filterBy.match_league, $options: "i" };
    }

    // Filter by team name (home or away)
    if (filterBy.match_team) {
        criteria.$or = [
            { match_hometeam_name: { $regex: filterBy.match_team, $options: "i" } },
            { match_awayteam_name: { $regex: filterBy.match_team, $options: "i" } }
        ];
    }

    // Filter by match date
    if (filterBy.match_date) {
        criteria.match_date = filterBy.match_date; // Assuming match_date is in the same format
    }

    return criteria;
}
