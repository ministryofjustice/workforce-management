const express = require('express')
const router = express.Router()
const moment = require('moment')
const { generateTeam, updateProbationPractitioner } = require('../data/generateData')
const probationTeams = require('../data/probation-teams.json')
const {
  getTeamTotals,
  getPractitioner,
  getCasesDueToEnd,
  getSentencesDueToEnd,
  getParoleReportsDue
} = require('../data/filterHelpers')

const team = generateTeam(12, 'N57BRP', 'N57A')

router.use('*', (req, { locals }, next) => {
  Object.assign(locals, {
    team,
    teamTotals: getTeamTotals(team),
    url: req.originalUrl,
    versionUrl: '/v10',
    moment: moment,
    longDateFormat: 'D MMMM YYYY',
    shortDateFormat: 'DD/MM/YYYY'
  })
  next()
})

router.get('/officer-view/:id', ({ params: { id }, session }, res) => {
  const probationPractitioner = !session[id] ? getPractitioner(id, team) : session[id].probationPractitioner
  const data = {
    probationPractitioner,
    id: id,
    casesDueToEnd: getCasesDueToEnd(probationPractitioner),
    sentencesDueToEnd: getSentencesDueToEnd(probationPractitioner),
    paroleReportsDue: getParoleReportsDue(probationPractitioner)
  }
  Object.assign(res.locals, data)
  Object.assign(session[id] || {}, data)
  res.render('v9/officer-view')
})

function updateLocals (res, id, session) {
  const probationPractitioner = !session[id] ? getPractitioner(id, team) : session[id].probationPractitioner
  Object.assign(res.locals, {
    probationPractitioner,
    id: id
  })
}

router.get('/officer-view/:id/officer-view-cases', ({ params: { id }, session }, res) => {
  updateLocals(res, id, session)
  res.render('v10/officer-view-cases')
})

router.get('/officer-view/:id/reductions', ({ params: { id }, session }, res) => {
  updateLocals(res, id, session)
  res.render('v10/officer-view-reductions')
})

router.get('/officer-view/:id/contracted-hours', ({ params: { id }, session }, res) => {
  updateLocals(res, id, session)
  res.render('v10/officer-view-contracted')
})

router.post('/officer-view/:id/contracted-hours', ({ body, params: { id }, session }, res) => {
  const probationPractitioner = !session[id] ? getPractitioner(id, team) : session[id].probationPractitioner
  probationPractitioner.contractedHours = body.contractedHours
  Object.assign(session[id] || {}, {
    probationPractitioner: updateProbationPractitioner(probationPractitioner),
    id: id
  })
  res.redirect(`/v10/officer-view/${id}`)
})

router.post('/allocate-handler', function (req, res) {
  var allocated = req.session.data.selected
  if (allocated === 'yes') {
    res.redirect('/v10/allocation-complete')
  } else {
    res.redirect('/v10/allocation-error')
  }
})

router.post('/region-handler', function (req, res) {
  const region = req.session.data['select-region']
  res.render('v10/pdu', { data: probationTeams, region })
})

router.get('/region-handler', function (req, res) {
  const pdu = req.session.data['select-pdu']
  const region = req.session.data['select-region']
  res.render('v10/pdu', { data: probationTeams, pdu, region })
})

router.post('/teams', function (req, res) {
  const pdu = req.session.data['select-pdu']
  const region = req.session.data['select-region']
  res.render('v10/teams', { data: probationTeams, pdu, region })
})

router.get('/teams', function (req, res) {
  const pdu = req.session.data['select-pdu']
  const region = req.session.data['select-region']
  const teams = req.session.data['select-teams']
  res.render('v10/teams', { data: probationTeams, pdu, region, teams })
})

router.post('/team-list', function (req, res) {
  const pdu = req.session.data['select-pdu']
  const region = req.session.data['select-region']
  const teams = req.session.data['select-teams']
  res.render('v10/team-list', { data: probationTeams, pdu, region, teams })
})

router.get('/unallocated-cases', function (req, res) {
  res.render('v10/unallocated-cases')
})

router.get('/team-list', function (req, res) {
  const region = req.session.data['select-region']
  const teams = req.session.data['select-teams']
  res.render('v10/team-list', { region, teams })
})

module.exports = router
