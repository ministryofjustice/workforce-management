const express = require('express')
const router = express.Router()
const { generateTeam } = require('../data/generateData')
const { getTeamTotals, getPractitioner, getCasesDueToEnd, getSentencesDueToEnd, getParoleReportsDue } = require('../data/filterHelpers')

const team = generateTeam(12, 'N57BRP', 'N57A')

router.use('*', (req, { locals }, next) => {
  Object.assign(locals, { team, teamTotals: getTeamTotals(team), url: req.originalUrl, versionUrl: '/v6'  })
  next()
})

router.get('/officer-view/:id',({ params: { id } }, res) => {
  const probationPractitioner = getPractitioner(id, team)
  Object.assign(res.locals, {
    probationPractitioner,
    casesDueToEnd: getCasesDueToEnd(probationPractitioner),
    sentencesDueToEnd: getSentencesDueToEnd(probationPractitioner),
    paroleReportsDue: getParoleReportsDue(probationPractitioner),
  })
  res.render('v6/officer-view')
})

router.get('/officer-view/:id/officer-view-cases',({ params: { id } }, res) => {
  res.locals.probationPractitioner = getPractitioner(id, team)
  res.render('v6/officer-view-cases')
})

router.post('/allocate-handler', function (req, res) {
  var allocated = req.session.data['selected']
  if (allocated == "yes") {
    res.redirect('/v6/allocation-complete')
  }
  else {
    res.redirect('/allocation-error')
  }

})


module.exports = router