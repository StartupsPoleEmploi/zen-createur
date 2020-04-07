const { job } = require('cron')
const winston = require('../lib/log')

require('../lib/db') // setup db connection

const postDeclarationStatusToSlack = require('../lib/postDeclarationStatusToSlack')

winston.info('Starting utilities agent')


// Every day at 9, 18
job('0 0 9,18 * * *', postDeclarationStatusToSlack, null, true, 'Europe/Paris')
