const express = require('express');
const path = require('path');

const router = express.Router();
const { transaction } = require('objection');
const {
  get
} = require('lodash');
const { uploadsDirectory: uploadDestination } = require('config');


const { sendDeclaration } = require('../lib/pe-api/declaration');
const { sendDocument } = require('../lib/pe-api/documents');
const { refreshAccessToken } = require('../lib/middleware/refreshAccessTokenMiddleware');
const { isUserTokenValid } = require('../lib/token');
const winston = require('../lib/log');
const {
  fetchDeclarationAndSaveAsFinishedIfAllDocsAreValidated,
} = require('../controllers/declarationCtrl');

const DeclarationRevenue = require('../models/DeclarationRevenue');
const DeclarationRevenueDocument = require('../models/DeclarationRevenueDocument');

const {
  getPDF,
  numberOfPage,
  removePage,
  handleNewFileUpload,
  IMG_EXTENSIONS,
} = require('../lib/pdf-utils');

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
          isTransmitted: file ? false : true,
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

router.get('/files', (req, res, next) => {
  if (!req.query.documentId) return res.status(400).json('Missing employerId');

  return DeclarationRevenueDocument.query()
    .eager('declarationRevenue.user')
    .findOne({
      id: req.query.documentId,
    })
    .then((document) => {
      if (get(document, 'declarationRevenue.user.id') !== req.session.user.id) {
        return res.status(404).json('No such file');
      }

      const extension = path.extname(document.file);

      // Not a PDF / convertible as PDF file
      if (extension !== '.pdf' && !IMG_EXTENSIONS.includes(extension)) {
        return res.sendFile(document.file, { root: uploadDestination });
      }

      return getPDF(document, uploadDestination).then((pdfPath) => {
        res.sendFile(pdfPath, { root: uploadDestination });
      });
    })
    .catch(next);
});

router.post('/validateDocument', (req, res, next) => {
  const { id } = req.body;

  if (!isUserTokenValid(req.user.tokenExpirationDate)) {
    return res.status(401).json('Expired token');
  }
  if (!id) return res.status(400).json('Missing id');

  return DeclarationRevenueDocument.query()
    .eager('declarationRevenue.[user, declaration.declarationMonth]')
    .findOne({ id })
    .then((revenueDoc) => {
      console.log('revenue doc', revenueDoc)
      if (
        !revenueDoc
        || get(revenueDoc, 'declarationRevenue.user.id') !== req.session.user.id
      ) {
        return res.status(404).json('Not found');
      }

      if (revenueDoc.isTransmitted) return revenueDoc;

      return (
        sendDocument({
          document: revenueDoc,
          accessToken: req.session.userSecret.accessToken,
        })
          .then(() =>
            fetchDeclarationAndSaveAsFinishedIfAllDocsAreValidated({
              declarationId: revenueDoc.declarationRevenue.declaration.id,
              userId: req.session.user.id,
            }))
          .then(() => revenueDoc)
      );
    })
    .then(r => res.json(r))
    .catch(next);
});

module.exports = router;
