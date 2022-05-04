const express = require('express')
const router = express.Router()
const routesAllocations0 = require('./routes/allocationsV0.js')
const v3 = require('./routes/v3.js')
const v6 = require('./routes/v6.js')
const v7 = require('./routes/v7.js')
const v8 = require('./routes/v8.js')
const v9 = require('./routes/v9.js')
const v10 = require('./routes/v10.js')
const v11 = require('./routes/v11.js')
const v12 = require('./routes/v12.js')
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
router.use('/v11', v11)
router.use('/v12', v12)
router.use('/_mvp', mvp)

router.post('/allocate-handler', function (req, res) {
  var allocated = req.session.data['allocated-officer']
  if (allocated === '') {
    res.redirect('/_mvp/allocation-complete')
  } else {
    res.redirect('/_mvp/case-allocate-error')
  }

})

router.get('/_mvp/scores', function (req, res) {
  const riskScores = {
    current: {
      date: '23 Jul 2021 at 12:00:00',
      scores: {
        RSR: {
          level: 'HIGH',
          score: 11.34,
          type: 'RSR'
        },
        OSPC: {
          level: 'MEDIUM',
          score: 8.76,
          type: 'OSP/C'
        },
        OSPI: {
          level: 'LOW',
          score: 3.45,
          type: 'OSP/I'
        }
      }
    },
    historical: [
      {
        date: '14 May 2019 at 12:00:00',
        scores: {
          RSR: {
            level: 'HIGH',
            score: 10.3,
            type: 'RSR'
          },
          OSPC: {
            level: 'MEDIUM',
            score: 7.76,
            type: 'OSP/C'
          },
          OSPI: {
            level: 'LOW',
            score: 3.45,
            type: 'OSP/I'
          }
        }
      },
      {
        date: '12 September 2018 at 12:00:00',
        scores: {
          RSR: {
            level: 'MEDIUM',
            score: 5.34,
            type: 'RSR'
          },
          OSPC: {
            level: 'MEDIUM',
            score: 6.76,
            type: 'OSP/C'
          },
          OSPI: {
            level: 'LOW',
            score: 3.45,
            type: 'OSP/I'
          }
        }
      }
    ]
  }

  const widgetData = {
    mappa: {
      level: 'CAT 2/LEVEL 1',
      isNominal: false,
      lastUpdated: '10th October 2021'
    },
    flags: [
      'Hate Crime'
    ],
    roshRiskSummary: {
      overallRisk: 'VERY_HIGH',
      riskToChildren: 'LOW',
      riskToPublic: 'VERY_HIGH',
      riskToKnownAdult: 'MEDIUM',
      riskToStaff: 'HIGH',
      lastUpdated: '10th October 2021'
    }
  }

  res.render('scores', { riskScores, widgetData })
})

module.exports = router
