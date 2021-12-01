const express = require('express')
const router = express.Router()
const routesAllocations0 = require('./routes/allocationsV0.js')
const v3 = require('./routes/v3.js')
const v6 = require('./routes/v6.js')
const v7 = require('./routes/v7.js')
const v8 = require('./routes/v8.js')
const v9 = require('./routes/v9.js')
const v10 = require('./routes/v10.js')
const mvp = require('./routes/mvp.js')

// Add your routes here - above the module.exports line
router.use('/allocations/0', routesAllocations0)

// Call in routes file from routes folder to keep routes.js cleaner
router.use('/v3', v3)
router.use('/v6', v6)
router.use('/v7', v7)
router.use('/v8', v8)
router.use('/v9', v9)
router.use('/v10', v10)
router.use('/_mvp', mvp)

router.post('/allocate-handler', function (req, res) {
  var allocated = req.session.data['allocated-officer']
  if (allocated === '') {
    res.redirect('/_mvp/allocation-complete')
  } else {
    res.redirect('/_mvp/case-allocate-error')
  }

})

router.get('/check-team-list', function(req, res) {
  var teamcheck = req.session.data['selected-team']
  if (teamcheck === 'EXN-West Essex OM1') {
    res.redirect('/v10/region')
  } else {
    res.redirect('/v10/team-list')
  }
})

module.exports = router
