const express = require('express');
const path = require('path');
const fs = require('fs');

const router = express.Router();

const {
  uploadMiddleware,
  checkPDFValidityMiddleware,
} = require('../lib/upload');
const {
  fetchDeclarationAndSaveAsFinishedIfAllDocsAreValidated,
} = require('../controllers/declarationCtrl');

const Declaration = require('../models/Declaration');
const Employer = require('../models/Employer');
const EmployerDocument = require('../models/EmployerDocument');
const ActivityLog = require('../models/ActivityLog');

const {
  handleNewFileUpload,
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

module.exports = router;
