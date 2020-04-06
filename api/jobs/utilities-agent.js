const { job } = require('cron')
const winston = require('../lib/log')

require('../lib/db') // setup db connection

const cleanOldFiles = require('../lib/cleanOldFiles')
const postDeclarationStatusToSlack = require('../lib/postDeclarationStatusToSlack')

winston.info('Starting utilities agent')

// Every sunday at 2:30
job('0 30 2 * * 1', cleanOldFiles, null, true, 'Europe/Paris')


// Every day at 9, 18
job('0 0 9,18 * * *', postDeclarationStatusToSlack, null, true, 'Europe/Paris')
