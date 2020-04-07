/* eslint-disable no-await-in-loop */
const { format, subDays } = require('date-fns')
const { Parser } = require('json2csv')
const fr = require('date-fns/locale/fr')
const fs = require('fs')
require('../lib/db')
const Declaration = require('../models/Declaration')
const EmployerDocument = require('../models/EmployerDocument')
const DOCUMENT_LABELS = require('../constants')


const getFormattedMonthAndYear = (date) =>
  format(date, 'MMMM YYYY', { locale: fr })

const getMissingDocumentLabelsFromDeclaration = (declaration) =>
  declaration.infos
    .filter(({ isTransmitted, file }) => !isTransmitted && file)
    .map(
      ({ type }) =>
        `${DOCUMENT_LABELS[type]} / ${getFormattedMonthAndYear(
          declaration.declarationMonth.month,
        )}`,
    )
    .concat(
      declaration.employers.reduce(
        (declarationPrev, employer) =>
          declarationPrev.concat(
            employer.documents
              .filter((doc) => !doc.isTransmitted)
              .map((doc) => {
                if (doc.type === EmployerDocument.types.employerCertificate) {
                  return `${doc.id} - ${DOCUMENT_LABELS.employerCertificate} ${
                    employer.employerName
                  } / ${getFormattedMonthAndYear(
                    declaration.declarationMonth.month,
                  )}`
                }
                return `${doc.id} - ${DOCUMENT_LABELS.salarySheet} ${
                  employer.employerName
                } / ${getFormattedMonthAndYear(
                  declaration.declarationMonth.month,
                )}`
              }),
          ),
        [],
      ),
    )

for (let i = 1; i < 16; i++) {
  Promise.all([
    // Get unfinished declarations from users who have not received a reminder in the last day
    Declaration.query()
      .eager('[declarationMonth, infos, user, employers.documents]')
      .join('Users', 'Users.id', '=', 'declarations.userId')
      .where({
        isFinished: false,
        hasFinishedDeclaringEmployers: true,
        monthId: i,
      })
      .andWhere(function() {
        this.where(
          'Users.lastDocsReminderDate',
          '<',
          subDays(new Date(), 1),
        ).orWhereNull('Users.lastDocsReminderDate')
      }),
  ])
    .then(([declarations]) => {
      const monthLabel = format(
        declarations[0].declarationMonth.month,
        'MM-YYYY',
      )

      const csv = declarations.map((declaration) => {
        const documents = getMissingDocumentLabelsFromDeclaration(declaration)
        console.log(documents)
        if (documents.length === 0) {
          documents.push('Pas de document retenu')
        }

        return {
          firstName: declaration.user.firstName,
          lastName: declaration.user.lastName,
          documents,
        }
      })

      const fields = ['firstName', 'lastName', 'documents']

      const json2csvParser = new Parser({ fields })
      fs.writeFileSync(
        `/home/api/scripts/${monthLabel}-documents-not-transmitted-to-pe.csv`,
        json2csvParser.parse(csv),
      )
    })
    .catch((err) => {
      console.error(err)
    })
}