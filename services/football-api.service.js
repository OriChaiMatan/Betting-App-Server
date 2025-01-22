import axios from 'axios'
import { logger } from './logger.service.js'
import { config } from 'dotenv'
import { dbService } from './db.service.js'
import { _matchService } from '../api/match/match.service.js'

config()

const BASE_URL = process.env.BASE_URL
const API_KEY = process.env.API_KEY

export async function updateDatabase() {
    logger.info("Updating football database...")
    try {
        await fetchFutureMatches()  // STEP 1: fetch new future matches
        await moveMatchesToPast()  // STEP 2: move matches to previous data
        logger.info("Football database updated successfully.")
    } catch (err) {
        logger.error("Error updating football database:", err)
        throw err
    }
}

async function moveMatchesToPast() {
    try {
        // Step 1: Retrieving all games from the "Future Games" table
        // const futureMatches = await db.collection('future-matches').find({}).toArray()
        const futureMatchesCollection = await dbService.getCollection('future-matches')
        const futureMatches = await futureMatchesCollection.find({}).toArray()

        // Step 2: Sorting the games by date and selecting games past the current date
        const now = new Date()
        const matchesToUpdate = futureMatches.filter(match => {
            const matchDate = new Date(match.match_date)
            return matchDate < now
        })

        if (matchesToUpdate.length > 0) {
            // Step 3: Send to the API to get up-to-date information about the games
            const updatedMatchesPromises = matchesToUpdate.map(async match => {
                const url = `https://apiv3.apifootball.com/?action=get_events&match_id=${match.match_id}&APIkey=${API_KEY}`
                const response = await axios.get(url)
                const updatedMatch = response.data[0]

                // Step 4: Filter games with "Finished" status
                if (updatedMatch.match_status === "Finished") {
                    const leagueId = updatedMatch.league_id
                    const homeTeamId = updatedMatch.match_hometeam_id
                    const awayTeamId = updatedMatch.match_awayteam_id

                    // Step 5: League search
                    // const league = await db.collection('leagues').findOne({ league_id: leagueId })
                    const leagueCollection = await dbService.getCollection('leagues')
                    const league = await leagueCollection.findOne({ league_id: leagueId })

                    const homeTeam = league.league_teams.find(team => team.team_key === homeTeamId)
                    const awayTeam = league.league_teams.find(team => team.team_key === awayTeamId)

                    await updateTeamMatches(homeTeam, updatedMatch.match_id, 'home')
                    await updateTeamMatches(awayTeam, updatedMatch.match_id, 'away')

                    const last5HomeMatches = await getLast5MatchesFromLeague(league, homeTeam.team_key, 'home')
                    const last5AwayMatches = await getLast5MatchesFromLeague(league, awayTeam.team_key, 'away')

                    const homeStatistics = await _calculateTeamStatistics(last5HomeMatches, homeTeam.team_key, 'home')
                    const awayStatistics = await _calculateTeamStatistics(last5AwayMatches, awayTeam.team_key, 'away')

                    await updateTeamStatisticsInLeague(league, homeTeam.team_key, homeStatistics, null) // Updating home statistics
                    await updateTeamStatisticsInLeague(league, awayTeam.team_key, null, awayStatistics) // Updating away statistics

                    return updatedMatch
                }

                return null
            })
            const updatedMatches = (await Promise.all(updatedMatchesPromises)).filter(match => match !== null)

            if (updatedMatches.length > 0) {
                // Step 6: Removing the games from the "Future Games" table
                const matchIds = updatedMatches.map(match => match.match_id)
                // await db.collection('future-matches').deleteMany({ match_id: { $in: matchIds } })
                const futureMatchesCollection = await dbService.getCollection('future-matches')
                await futureMatchesCollection.deleteMany({ match_id: { $in: matchIds } })

                // Step 6: Saving in the "past games" table
                // await db.collection('previous-matches').insertMany(updatedMatches)
                const pastMatchesCollection = await dbService.getCollection('previous-matches')
                await pastMatchesCollection.insertMany(updatedMatches)
                logger.info(`${updatedMatches.length} future matches moved to past.`)
            } else {
                logger.error("No finished matches to move.")
            }
        } else {
            logger.error("No future matches to move.")
        }
    } catch (err) {
        logger.error("Error moving future matches to past:", err)
        throw err
    }
}

async function updateTeamMatches(team, matchId, type) {
    try {
        const matchesField = type === 'home' ? 'last_5_home_matches' : 'last_5_away_matches'

        const updatedMatches = [...team[matchesField], { match_id: matchId }]  // Add the match_id to the team's match list

        if (updatedMatches.length > 5) {         // If there are more than 5 matches, remove the oldest match
            updatedMatches.shift()  // Remove the oldest match
        }

        const leaguesCollection = await dbService.getCollection('leagues')
        // Update the team with the updated list of matches
        await leaguesCollection.updateOne(
            { 'league_teams.team_key': team.team_key },
            { $set: { [`league_teams.$.${matchesField}`]: updatedMatches } }
        )

        console.log(`Team ${team.team_name} updated with new match ${matchId} (${type}).`)
    } catch (err) {
        console.error(`Error updating team ${team.team_name} with match ${matchId}:`, err)
    }
}

async function getLast5MatchesFromLeague(league, teamKey, type) {
    // Find the team in the league's teams
    const team = league.league_teams.find(t => t.team_key === teamKey)

    if (!team) {
        console.log(`Team with key ${teamKey} not found in league.`)
        return []
    }

    // Define the field based on the type (home or away)
    const field = type === 'home' ? 'last_5_home_matches' : 'last_5_away_matches'

    // Return the last 5 matches (either home or away based on the type)
    return team[field] || []
}

async function updateTeamStatisticsInLeague(league, teamKey, homeStatistics, awayStatistics) {
    try {
        const team = league.league_teams.find(t => t.team_key === teamKey)
        
        if (!team) {
            logger.error(`Team with key ${teamKey} not found in league.`)
            return
        }

        if (homeStatistics) {
            team.home_statistic = homeStatistics
        }

        if (awayStatistics) {
            team.away_statistic = awayStatistics
        }

        const leaguesCollection = await dbService.getCollection('leagues')
        await leaguesCollection.updateOne(
            { league_id: league.league_id },
            { $set: { "league_teams.$[team].home_statistic": team.home_statistic, "league_teams.$[team].away_statistic": team.away_statistic } },
            { arrayFilters: [{ "team.team_key": teamKey }] }
        )

        logger.info(`Updated statistics for team ${teamKey} in league ${league.league_id}`)
    } catch (err) {
        logger.error(`Error updating statistics for team ${teamKey} in league ${league.league_id}:`, err)
        throw err
    }
}


export const fetchData = async () => {
    fetchPastMatches()
    fetchFutureMatches()
    fetchAndCalculateLeagueData()
}

// Main function to fetch and calculate data
async function fetchAndCalculateLeagueData() {
    try {
        // Step 1: Fetch leagues data
        const response = await axios.get(`${BASE_URL}`, {
            params: {
                action: 'get_leagues',
                APIkey: API_KEY
            }
        })
        const leagues = Array.isArray(response.data) ? response.data.filter(league => league.league_id == 3 || league.league_id == 202) : []
        // const leagues = Array.isArray(response.data) ? response.data : []

        // Step 2: Fetch teams and matches for each league
        await Promise.all(leagues.map(async (league) => {
            const teams = await _fetchTeamsByLeagueId(league.league_id)

            league.league_teams = await Promise.all(teams.map(async (team) => {
                const teamData = await _fetchTeamMatches(team.team_key, league.league_id)
                return { ...team, ...teamData }
            }))
        }))
        await dbService.saveLeagueData(leagues)

        // Step 4: Return the data
    } catch (error) {
        logger.error('Error fetching or calculating league data:', error)
    }
}

// Helper function to fetch teams by league ID
async function _fetchTeamsByLeagueId(leagueId) {
    try {
        const response = await axios.get(`${BASE_URL}`, {
            params: {
                action: 'get_teams',
                league_id: leagueId,
                APIkey: API_KEY
            }
        })
        return Array.isArray(response.data) ? response.data : []
    } catch (error) {
        logger.error(`Error fetching teams for league ${leagueId}:`, error)
        return []
    }
}

// Helper function to fetch team matches and calculate statistics
async function _fetchTeamMatches(teamId, leagueId) {
    try {
        const today = new Date();
        const fromDate = new Date();
        fromDate.setMonth(today.getMonth() - 6); // 6 months ago

        const formatDate = (date) => date.toISOString().split('T')[0]

        const response = await axios.get(`${BASE_URL}`, {
            params: {
                action: 'get_events',
                APIkey: API_KEY,
                team_id: teamId,
                league_id: leagueId,
                from: formatDate(fromDate),
                to: formatDate(today),
            }
        })

        const matches = Array.isArray(response.data) ? response.data : []

        // Filter matches for home and away teams
        const homeMatches = matches
            .filter(match => match.match_hometeam_id === teamId)
            .slice(0, 6)
            .map(match => ({ match_id: match.match_id }))

        const awayMatches = matches
            .filter(match => match.match_awayteam_id === teamId)
            .slice(0, 6)
            .map(match => ({ match_id: match.match_id }))

        // Step 5: Calculate team statistics
        const homeStats = await _calculateTeamStatistics(homeMatches, teamId, 'home')
        const awayStats = await _calculateTeamStatistics(awayMatches, teamId, 'away')

        return {
            last_5_home_matches: homeMatches,
            last_5_away_matches: awayMatches,
            home_statistic: homeStats,
            away_statistic: awayStats,
        };
    } catch (error) {
        logger.error(`Error fetching matches for team ${teamId}:`, error)
        return {
            last_5_home_matches: [],
            last_5_away_matches: [],
            home_statistic: {},
            away_statistic: {},
        }
    }
}

async function _calculateTeamStatistics(matches, teamId, type) {
    let winCount = 0, drawCount = 0, lossCount = 0;
    let totalGoalsFirstHalf = 0, totalGoalsFullMatch = 0;

    const fullMatchStatsSum = {};
    const firstHalfStatsSum = {};

    const cardsStatistic = {
        yellow: { first_half: 0, second_half: 0, full_match: 0 },
        red: { first_half: 0, second_half: 0, full_match: 0 }
    };

    const goalIntervals = {
        "0-15": 0, "16-30": 0, "31-45": 0,
        "46-60": 0, "61-75": 0, "76-90": 0
    };

    for (const match of matches) {
        try {
            const matchData = await _matchService.getPastMatchById(match.match_id);

            if (matchData && Object.keys(matchData).length > 0) {
                const isHome = type === 'home';
                const teamScoreFirstHalf = isHome
                    ? parseInt(matchData.match_hometeam_halftime_score, 10) || 0
                    : parseInt(matchData.match_awayteam_halftime_score, 10) || 0;
                const teamScoreFullMatch = isHome
                    ? parseInt(matchData.match_hometeam_ft_score, 10) || 0
                    : parseInt(matchData.match_awayteam_ft_score, 10) || 0;
                const opponentScore = isHome
                    ? parseInt(matchData.match_awayteam_ft_score, 10) || 0
                    : parseInt(matchData.match_hometeam_ft_score, 10) || 0;

                // Win/draw/loss calculation
                if (teamScoreFullMatch > opponentScore) winCount++;
                else if (teamScoreFullMatch === opponentScore) drawCount++;
                else lossCount++;

                totalGoalsFirstHalf += teamScoreFirstHalf;
                totalGoalsFullMatch += teamScoreFullMatch;

                // Accumulate statistics
                if (Array.isArray(matchData.statistics)) {
                    matchData.statistics.forEach(stat => {
                        const statValue = isHome
                            ? parseInt(stat.home, 10) || 0
                            : parseInt(stat.away, 10) || 0;

                        if (!fullMatchStatsSum[stat.type]) {
                            fullMatchStatsSum[stat.type] = { sum: 0, count: 0 };
                        }
                        fullMatchStatsSum[stat.type].sum += statValue;
                        fullMatchStatsSum[stat.type].count++;
                    });
                }

                if (Array.isArray(matchData.statistics_1half)) {
                    matchData.statistics_1half.forEach(stat => {
                        const statValue = isHome
                            ? parseInt(stat.home, 10) || 0
                            : parseInt(stat.away, 10) || 0;

                        if (!firstHalfStatsSum[stat.type]) {
                            firstHalfStatsSum[stat.type] = { sum: 0, count: 0 };
                        }
                        firstHalfStatsSum[stat.type].sum += statValue;
                        firstHalfStatsSum[stat.type].count++;
                    });
                }

                // Process cards
                if (Array.isArray(matchData.cards)) {
                    matchData.cards.forEach(card => {
                        const isTeamCard = (isHome && card.home_fault) || (!isHome && card.away_fault);
                        if (!isTeamCard) return;

                        const cardMinute = parseInt(card.minute, 10) || 0;
                        const isFirstHalf = cardMinute <= 45;

                        if (card.card === 'yellow card') {
                            cardsStatistic.yellow.full_match++;
                            if (isFirstHalf) cardsStatistic.yellow.first_half++;
                            else cardsStatistic.yellow.second_half++;
                        } else if (card.card === 'red card') {
                            cardsStatistic.red.full_match++;
                            if (isFirstHalf) cardsStatistic.red.first_half++;
                            else cardsStatistic.red.second_half++;
                        }
                    });
                }

                // Process goalscorer
                if (Array.isArray(matchData.goalscorer)) {
                    matchData.goalscorer.forEach(goal => {
                        const isTeamScorer = (isHome && goal.home_scorer_id) || (!isHome && goal.away_scorer_id);
                        if (!isTeamScorer) return;

                        const goalTime = parseInt(goal.time, 10);
                        if (goalTime >= 0 && goalTime <= 15) goalIntervals["0-15"]++;
                        else if (goalTime >= 16 && goalTime <= 30) goalIntervals["16-30"]++;
                        else if (goalTime >= 31 && goalTime <= 45) goalIntervals["31-45"]++;
                        else if (goalTime >= 46 && goalTime <= 60) goalIntervals["46-60"]++;
                        else if (goalTime >= 61 && goalTime <= 75) goalIntervals["61-75"]++;
                        else if (goalTime >= 76 && goalTime <= 90) goalIntervals["76-90"]++;
                    });
                }
            }
        } catch (error) {
            logger.warn(`Error fetching data for match ID ${match.match_id}:`, error);
        }
    }

    const totalMatches = matches.length || 1;

    return {
        win_percentage: parseFloat(((winCount / totalMatches) * 100).toFixed(2)),
        draw_percentage: parseFloat(((drawCount / totalMatches) * 100).toFixed(2)),
        loss_percentage: parseFloat(((lossCount / totalMatches) * 100).toFixed(2)),
        avg_goals_first_half: (totalGoalsFirstHalf / totalMatches).toFixed(2),
        avg_goals_full_match: (totalGoalsFullMatch / totalMatches).toFixed(2),
        goal_intervals: goalIntervals,
        cards_statistic: {
            first_half: {
                yellow_card_first_half: (cardsStatistic.yellow.first_half / totalMatches).toFixed(2),
                red_card_first_half: (cardsStatistic.red.first_half / totalMatches).toFixed(2),
            },
            second_half: {
                yellow_card_second_half: (cardsStatistic.yellow.second_half / totalMatches).toFixed(2),
                red_card_second_half: (cardsStatistic.red.second_half / totalMatches).toFixed(2),
            },
            full_match: {
                yellow_card_full_match: (cardsStatistic.yellow.full_match / totalMatches).toFixed(2),
                red_card_full_match: (cardsStatistic.red.full_match / totalMatches).toFixed(2)
            }
        },
        avg_statistics: Object.keys(fullMatchStatsSum).reduce((acc, type) => {
            const { sum, count } = fullMatchStatsSum[type];
            const avg = sum / count;
            if (avg > 0) acc[type] = parseFloat(avg.toFixed(2));
            return acc;
        }, {}),
        avg_first_half_statistics: Object.keys(firstHalfStatsSum).reduce((acc, type) => {
            const { sum, count } = firstHalfStatsSum[type];
            const avg = sum / count;
            if (avg > 0) acc[type] = parseFloat(avg.toFixed(2));
            return acc;
        }, {})
    };
}


const fetchPastMatches = async () => {
    try {
        const today = new Date()
        const fromDate = new Date()
        fromDate.setMonth(today.getMonth() - 6)  // Fetch past matches from the last 6 months

        const formatDate = (date) => date.toISOString().split('T')[0]

        const response = await axios.get(`${BASE_URL}`, {
            params: {
                action: 'get_events',
                APIkey: API_KEY,
                from: formatDate(fromDate),
                to: formatDate(today),
            }
        })

        const matches = Array.isArray(response.data) ? response.data.filter(match => match.league_id == 3 || match.league_id == 202) : []
        await dbService.savePastMatchData(matches)
    } catch (error) {
        logger.error(`Error fetching past matches`, error)
        return []
    }
}

// Function to fetch future matches
const fetchFutureMatches = async () => {
    try {
        const today = new Date()
        const nextDate = new Date()
        nextDate.setMonth(today.getMonth() + 2)  // Fetch future matches for the next 2 month

        const formatDate = (date) => date.toISOString().split('T')[0]

        const response = await axios.get(`${BASE_URL}`, {
            params: {
                action: 'get_events',
                APIkey: API_KEY,
                from: formatDate(today),
                to: formatDate(nextDate),
            }
        })

        const matches = Array.isArray(response.data) ? response.data.filter(match => match.league_id == 3 || match.league_id == 202) : []
        await dbService.saveFutureMatchData(matches)
    } catch (error) {
        logger.error(`Error fetching future matches for team`, error)
        return []
    }
}