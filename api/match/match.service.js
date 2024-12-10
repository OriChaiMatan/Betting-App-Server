import { utilService } from "../../services/util.service.js"
import { logger } from "../../services/logger.service.js"
import { dbService } from "../../services/db.service.js"
import mongodb from 'mongodb'
const {ObjectId} = mongodb

const previousMatchesCollectionName = 'previous-matches'
const futureMatchesCollectionName = 'future-matches'

export const _matchService = {
    getPastGames,
    getFutureGames,
    getPastMatchById,
    getFutureMatchById,
}

async function getPastGames() {
    try {
        const criteria = _buildCriteria()
        const collection = await dbService.getCollection(previousMatchesCollectionName)
        const matchCursor = await collection.find(criteria)

        const previousMatches = await matchCursor.toArray()
        return previousMatches
    } catch (err) {
        logger.error(err)
        throw err
    }
}

async function getFutureGames() {
    try {
        const criteria = _buildCriteria()
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

function _buildCriteria() {
    const criteria = {}
    return criteria
}