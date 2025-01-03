import { dbService } from '../../services/db.service.js'
import { logger } from '../../services/logger.service.js'
import mongodb from 'mongodb'
const { ObjectId } = mongodb

export const userService = {
    add, // Create (Signup)
    getById, // Read (Profile page)
    update, // Update (Edit profile)
    remove, // Delete (remove user)
    query, // List (of users)
    getByUserEmail // Used for Login
}

const collectionName = 'users'

const users = await query()

async function query(filterBy = {}) {
    const criteria = _buildCriteria(filterBy)
    try {
        const collection = await dbService.getCollection(collectionName)
        var users = await collection.find(criteria).toArray()
        users = users.map(user => {
            delete user.password
            user.createdAt = new ObjectId(user._id).getTimestamp()
            // Returning fake fresh data
            // user.createdAt = Date.now() - (1000 * 60 * 60 * 24 * 3) // 3 days ago
            return user
        })
        return users
    } catch (err) {
        logger.error('cannot find users', err)
        throw err
    }
}


async function getById(userId) {
    try {
        const collection = await dbService.getCollection(collectionName)
        const user = await collection.findOne({ _id: new ObjectId(userId) })
        delete user.password
        return user
    } catch (err) {
        logger.error(`while finding user by id: ${userId}`, err)
        throw err
    }
}

async function getByUserEmail(email) {
    try {
        console.log(" getByUserEmail email", email)
        const collection = await dbService.getCollection(collectionName)
        const user = await collection.findOne({ email })
        return user
    } catch (err) {
        logger.error(`while finding user by email: ${email}`, err)
        throw err
    }
}

async function remove(userId) {
    try {
        const collection = await dbService.getCollection(collectionName)
        await collection.deleteOne({ _id: new ObjectId(userId) })
    } catch (err) {
        logger.error(`cannot remove user ${userId}`, err)
        throw err
    }
}

async function update(user) {
    logger.info(user, 'user')
    try {
        // peek only updatable properties
        const userToSave = {
            _id: new ObjectId(user._id), // needed for the returnd obj
            favoriteLeagues: user.favoriteLeagues,
            favoriteTeams: user.favoriteTeams,
            favoriteMatches: user.favoriteMatches,
            allowNotifications: user.allowNotifications,
        }
        const collection = await dbService.getCollection(collectionName)
        await collection.updateOne({ _id: userToSave._id }, { $set: userToSave })
        logger.info(userToSave, 'user to save')
        return userToSave
    } catch (err) {
        logger.error(`cannot update user ${user._id}`, err)
        throw err
    }
}

async function add(user) {
    try {
        // peek only updatable fields!
        const userToAdd = {
            password: user.password,
            fullname: user.fullname,
            email: user.email,
            createAt: user.createAt || new Date().toISOString(),
            allowNotifications: user.allowNotifications,
            favoriteLeagues: [],
            favoriteTeams: [], 
            favoriteMatches: [],
        }
        logger.debug(userToAdd)
        const collection = await dbService.getCollection(collectionName)
        await collection.insertOne(userToAdd)
        return userToAdd
    } catch (err) {
        logger.error('cannot add user', err)
        throw err
    }
}

function _buildCriteria(filterBy) {
    const criteria = {}
    if (filterBy.txt) {
        const txtCriteria = { $regex: filterBy.txt, $options: 'i' }
        criteria.$or = [{
            username: txtCriteria
        },
        {
            fullname: txtCriteria
        }
        ]
    }
    if (filterBy.minBalance) {
        criteria.score = { $gte: filterBy.minBalance }
    }
    return criteria
}