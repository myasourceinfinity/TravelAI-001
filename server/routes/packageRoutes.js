const express = require('express');
const router  = express.Router();
const multer  = require('multer');
const upload  = multer({ storage: multer.memoryStorage() });

const { 
  getMatchingPackages, 
  getMyPackages,
  createSinglePackage,
  parseAndValidateBulkPackages,
  confirmBulkImportPackages,
  updateSinglePackage
} = require('../controllers/packageController');

router.get('/', getMatchingPackages);
router.get('/my', getMyPackages);
router.post('/single', createSinglePackage);
router.post('/bulk/validate', upload.single('file'), parseAndValidateBulkPackages);
router.post('/bulk/confirm', confirmBulkImportPackages);
router.put('/:id', updateSinglePackage);

module.exports = router;

