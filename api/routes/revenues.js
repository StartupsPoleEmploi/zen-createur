const express = require('express');

const router = express.Router();
const { transaction } = require('objection');

const { sendDeclaration } = require('../lib/pe-api/declaration');
const { sendDocument } = require('../lib/pe-api/documents');
const { refreshAccessToken } = require('../lib/middleware/refreshAccessTokenMiddleware');
const { isUserTokenValid } = require('../lib/token');
const winston = require('../lib/log');

const DeclarationRevenue = require('../models/DeclarationRevenue');
const DeclarationRevenueDocument = require('../models/DeclarationRevenueDocument');

router.post(
  '/files',
  (req, res, next) => {
    const { file, type, declarationRevenueId, originalFileName } = req.body;

    if (!declarationRevenueId) return res.status(400).json('Missing declarationRevenueId');
    if (!type) return res.status(400).json('Missing type');

    const fetchRevenue = () =>
      DeclarationRevenue.query()
        .eager('[documents]')
        .findOne({
          id: declarationRevenueId,
          userId: req.session.user.id,
        });

    return fetchRevenue()
      .then(async (revenue) => {
        if (!revenue) return res.status(404).json('No such revenues');

        const existingDocument = revenue.documents.find(
          (document) => document.type === type,
        );

        const documentFileObj = {
          file,
          type,
          declarationRevenueId,
          originalFileName,
          isTransmitted: false,
          isCleanedUp: false
        }

        if (existingDocument) {
          return DeclarationRevenueDocument.query().update(documentFileObj)
            .where('id', existingDocument.id)
        } else {
          return DeclarationRevenueDocument.query().insert(documentFileObj);
        }
      })
      .then(fetchRevenue)
      .then((result) => res.json(result))
      .catch(next);
  },
);

module.exports = router;
