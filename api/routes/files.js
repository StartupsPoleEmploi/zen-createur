const express = require('express');
const path = require('path');
const fs = require('fs');

const router = express.Router();
const { uploadsDirectory: uploadDestination } = require('config');

const {
  uploadMiddleware,
  checkPDFValidityMiddleware,
} = require('../lib/upload');
const {
  fetchDeclarationAndSaveAsFinishedIfAllDocsAreValidated,
} = require('../controllers/declarationCtrl');

const Declaration = require('../models/Declaration');
const DeclarationRevenueDocument = require('../models/DeclarationRevenueDocument');

const {
  getPDF,
  numberOfPage,
  removePage,
  handleNewFileUpload,
  IMG_EXTENSIONS,
} = require('../lib/pdf-utils');

router.post(
  '/',
  uploadMiddleware.single('document'),
  checkPDFValidityMiddleware,
  async (req, res, next) => {
    const { fileName } = req.body;

    if (!req.file) return res.status(400).json('Missing file');

    try {
      documentFileObj = await handleNewFileUpload({
        newFilename: req.file.filename,
        existingDocumentFile: fileName,
        isAddingFile: !!fileName,
      });

      res.json(documentFileObj);
    } catch (err) {
      // To get the correct error message front-side,
      // we need to ensure that the HTTP status is 413
      return res.status(413).json(err.message);
    }
  },
);


router.post('/remove-file-page', (req, res, next) => {
  const { file, pageNumberToRemove } = req.body;

  if (!file) return res.status(400).json('Missing file');
  const pageNumber = parseInt(pageNumberToRemove, 10);
  if (!pageNumber || Number.isNaN(pageNumber)) {
    return res.status(400).json('No page to remove');
  }

  const pdfFilePath = `${uploadDestination}${file}`;
  return numberOfPage(pdfFilePath)
    .then((pageRemaining) => {
      if (pageRemaining === 1) {
        // Remove last page: delete the file and delete the reference in database
        return new Promise((resolve, reject) => {
          fs.unlink(pdfFilePath, (deleteError) => {
            if (deleteError) return reject(deleteError);

            // todo remove from all file table
            return DeclarationRevenueDocument
              .query()
              .delete()
              .where('file', file)
              .then(resolve)
              .catch(reject);
          });
        });
      }
      // Only remove the page
      return removePage(pdfFilePath, pageNumberToRemove);
    })
    .then(() => res.json('done'));
});

module.exports = router;
