import mongoDB from 'mongodb'
const { MongoClient } = mongoDB
import { League } from '../models/league.js'

import { config } from '../config/index.js'
import { logger } from './logger.service.js'


export const dbService = {
    getCollection,
    saveLeagueData,
    savePastMatchData,
    saveFutureMatchData
}

var dbConn = null

async function getCollection(collectionName) {
    try {
        const db = await connect()
        const collection = await db.collection(collectionName)
        return collection
    } catch (err) {
        logger.error('Failed to get Mongo collection', err)
        throw err
    }
}

async function connect() {
    if (dbConn) return dbConn
    try {
        // console.log("config.dbURL", config.dbURL)
        const client = await MongoClient.connect(config.dbURL)
        const db = client.db(config.dbName)
        dbConn = db
        logger.info('Connected to DB')
        return db
    } catch (err) {
        logger.error('Cannot Connect to DB', err)
        throw err
    }
}


async function saveLeagueData(leagueData) {
    try {
        const db = await connect()
        const collection = await db.collection('leagues')

        // Check if the league already exists using `league_key`
        const existingLeague = await collection.findOne({ league_key: leagueData.league_key })

        if (existingLeague) {
            // If league exists, update the league data
            await collection.updateOne(
                { league_key: leagueData.league_key },
                { $set: { league_teams: leagueData.league_teams } }
            )
            logger.info(`Updated league: ${leagueData.league_name}`)
        } else {
            // If league does not exist, insert new league document
            // Ensure leagueData is an object and not an array
            if (Array.isArray(leagueData)) {
                // If leagueData is an array, you might want to use insertMany
                await collection.insertMany(leagueData)
                logger.info(`Created new leagues`)
            } else {
                // If it's a single object, use insertOne
                await collection.insertOne(leagueData)
                logger.info(`Created new league: ${leagueData.league_name}`)
            }
        }
    } catch (err) {
        logger.error('Error saving league data:', err)
        throw err
    }
}

async function savePastMatchData(matchData) {
    try {
        const db = await connect()
        const collection = await db.collection('previous-matches')

        if (Array.isArray(matchData)) {
            // If matchData is an array, insert multiple documents
            await collection.insertMany(matchData)
            logger.info(`Created new past matches`)
        } else {
            // If matchData is a single object, insert one document
            await collection.insertOne(matchData)
            logger.info(`Created new past match: ${matchData.match_id}`)
        }
    } catch (err) {
        logger.error('Error saving past match data:', err)
        throw err
    }
}

async function saveFutureMatchData(matchData) {
    try {
        const db = await connect()
        const collection = await db.collection('future-matches')

        if (Array.isArray(matchData)) {
            // If matchData is an array, insert multiple documents
            await collection.insertMany(matchData)
            logger.info(`Created new future matches`)
        } else {
            // If matchData is a single object, insert one document
            await collection.insertOne(matchData)
            logger.info(`Created new future match: ${matchData.match_id}`)
        }
    } catch (err) {
        logger.error('Error saving future match data:', err)
        throw err
    }
}
