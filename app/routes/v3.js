const express = require('express')
const router = express.Router()
const { generateTeam } = require('../data/generateData')
const { getTeamTotals, getPractitioner, getCasesDueToEnd, getSentencesDueToEnd, getParoleReportsDue } = require('../data/filterHelpers')

const team = generateTeam(9, 'N57BRP', 'N57A')

router.use('*', (req, { locals }, next) => {
  Object.assign(locals, { team, teamTotals: getTeamTotals(team), url: req.originalUrl, versionUrl: '/v3'  })
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
  res.render('v3/officer-view')
})

router.get('/officer-view/:id/officer-view-cases',({ params: { id } }, res) => {
  res.locals.probationPractitioner = getPractitioner(id, team)
  res.render('v3/officer-view-cases')
})

router.post('/allocate-handler', function (req, res) {
  var allocated = req.session.data['selected']
  if (allocated == "yes") {
    res.redirect('/v3/allocation-complete')
  }
  else {
    res.redirect('/allocation-error')
  }

})


module.exports = router