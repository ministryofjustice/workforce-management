const moment = require('moment')
const { getPractitionerTotals, SCHEDULED, ARCHIVED, ACTIVE } = require('./filterHelpers')
const { probationPractitionerTemplates } = require('./probation_practitioner_templates.json')
const { referenceDate, serviceUserTemplates, forenames, surnames, postCodes } = require('./service_user_templates.json')
const tierConversion = require('./tier_conversion.json')
const gradeConversion = require('./grade_conversion.json')
const tierPoints = require('./points_constants.json')
const tierKeys = Object.keys(tierConversion)

let uniqueCount = 0
const getUnique = () => uniqueCount++
const timeOffsetMilliseconds = moment().diff(moment(referenceDate))

const applyOffset = momentDate => moment(new Date(momentDate)).add(timeOffsetMilliseconds, 'ms')

const updateServiceUserDates = (serviceUser) => {
  serviceUser.sentenceStart = applyOffset(serviceUser.sentenceStart)
  serviceUser.sentenceEnd = applyOffset(serviceUser.sentenceEnd)
  serviceUser.allocationDate = applyOffset(serviceUser.allocationDate)
  serviceUser.caseEndDate = applyOffset(serviceUser.caseEndDate)
  serviceUser.paroleReportDueDate = applyOffset(serviceUser.paroleReportDueDate)
  serviceUser.DOB = applyOffset(serviceUser.DOB)
}
const updateDates = () => {
  for (let serviceUserKey in serviceUserTemplates) {
    const serviceUser = serviceUserTemplates[serviceUserKey]
    Array.isArray(serviceUser) ? serviceUser.forEach(su => updateServiceUserDates(su)) : updateServiceUserDates(serviceUser)
  }
  probationPractitionerTemplates.forEach(probationPractitioner => {
    probationPractitioner.lastAllocated = applyOffset(probationPractitioner.lastAllocated)
    probationPractitioner.reductions.forEach(reduction => {
      reduction.start = applyOffset(reduction.start)
      reduction.end = applyOffset(reduction.end)
    })
    probationPractitioner.serviceUsers.forEach(su => {
      if (su.allocationDate) su.allocationDate = applyOffset(su.allocationDate)
      if (su.sentenceEnd) su.sentenceEnd = applyOffset(su.sentenceEnd)
      if (su.caseEndDate) su.caseEndDate = applyOffset(su.caseEndDate)
      if (su.paroleReportDueDate) su.paroleReportDueDate = applyOffset(su.paroleReportDueDate)
    })
  })
}
updateDates()

const generateServiceUsers = (OM_Key, practitionerTemplate) => {
  const serviceUsers = []
  tierKeys.filter(key => practitionerTemplate[key]).forEach(
    key => {
      const { serviceUsers: currentServiceUsers = [] } = practitionerTemplate
      const { tier, receivingFrom } = tierConversion[key]
      const currentKeyServiceUsers = currentServiceUsers.filter(({ tier: suTier }) => tier === suTier)
      for (let index = 0; index < practitionerTemplate[key]; index++) {
        const unique = getUnique()
        const template = serviceUserTemplates[key]?.length > 0 ? serviceUserTemplates[key][Math.floor(Math.random() * serviceUserTemplates[key].length)] : serviceUserTemplates['blank']
        const newValues = {
          tier,
          receivingFrom,
          name: `${forenames[unique % forenames.length]} ${surnames[unique % surnames.length]}`,
          postcode: postCodes[unique % postCodes.length],
          crn: `J${678911 + (unique * 3)}`,
          pnc: `2012/${123100000 + (unique * 131)}F`,
          previousProbationOfficer: [],
        }
        if (index >= currentKeyServiceUsers.length) serviceUsers.push(Object.assign({}, template, newValues))
        else serviceUsers.push(Object.assign({}, template, newValues, currentKeyServiceUsers[index]))
      }
    }
  )
  return serviceUsers
}

const calculateNextChange = ({ reductions }, now = moment()) =>
  reductions.reduce((nextDate, { start, end }) => {
    if (start.isAfter(now) && (!nextDate || start.isSameOrBefore(nextDate))) return start
    else if (end.isAfter(now) && (!nextDate || end.isSameOrBefore(nextDate))) return end
    return nextDate
  }, 0)

const calculateTotalReductions = ({ reductions }, now = moment()) => {
  reductions.forEach(reduction => {
    const { status, start, end } = reduction
    if (status === SCHEDULED && start.isSameOrBefore(now)) reduction.status = ACTIVE
    if (status === ACTIVE && end.isBefore(now)) reduction.status = ARCHIVED
  })
  return reductions.filter(({ status }) => status === ACTIVE).reduce((total, { hours }) => total + Number(hours), 0)
}

const calculatePointsAvailable = (contractedHours, totalReductions) => {
  const hours = (contractedHours - totalReductions)
  return Math.ceil((2176 / 37) * (hours || 1))
}

const calculatePointsUsed = probationPractitioner => tierKeys.reduce((accumulator, key) =>
  (probationPractitioner?.[key] ? tierPoints[key] * probationPractitioner[key] : 0) + accumulator, 0)

const getTotalInTimePeriod = (serviceUsers, key, days = 7) => {
  const momentSince = moment().subtract(7, 'days')
  return serviceUsers.filter((su) => momentSince.isBefore(su[key]))
    .sort((suA, suB) => moment.utc(suA[key].timeStamp).diff(moment.utc(suB[key].timeStamp)))
}


function getRandomInt(min, max) {
  min = Math.ceil(1);
  max = Math.floor(4);
  return Math.floor(Math.random() * (max - min) + min); //The maximum is exclusive and the minimum is inclusive
}


const updateProbationPractitioner = probationPractitioner => {
  const totalReductions = calculateTotalReductions(probationPractitioner)
  const pointsAvailable = calculatePointsAvailable(probationPractitioner.contractedHours, totalReductions)
  const pointsUsed = calculatePointsUsed(probationPractitioner)
  const capacity = Math.round((pointsUsed / pointsAvailable) * 100)

  return Object.assign(probationPractitioner,
    {
      allocationsInLast7: getRandomInt,
      totalReductions: totalReductions,
      nextChange: calculateNextChange(probationPractitioner),
      pointsUsed: pointsUsed,
      pointsAvailable: pointsAvailable,
      capacity: capacity,
      available: capacity <= 110 ? 'Yes' : 'No',
    }
  )
}

const generateProbationPractitioner = (index, teamCode, OM_KeyPrefix) => {
  const practitionerTemplate = probationPractitionerTemplates[index % probationPractitionerTemplates.length]
  const OM_Key = OM_KeyPrefix + String(index).padStart(2, '0')
  const serviceUsers = generateServiceUsers(OM_Key, practitionerTemplate)
  const totalReductions = calculateTotalReductions(practitionerTemplate)
  const nextChange = calculateNextChange(practitionerTemplate)
  const pointsUsed = calculatePointsUsed(practitionerTemplate)
  const pointsAvailable = calculatePointsAvailable(practitionerTemplate.contractedHours, totalReductions)
  const capacity = Math.round((pointsUsed / pointsAvailable) * 100)
  const available = capacity <= 110 ? 'Yes' : 'No'
  return Object.assign(practitionerTemplate,
    {
      Team_Code: teamCode,
      OM_Key,
      serviceUsers,
      allocationsInLast7: getRandomInt,
      totalReductions,
      nextChange,
      pointsUsed,
      pointsAvailable,
      capacity,
      available,
      name: `${practitionerTemplate.OM_Forename} ${practitionerTemplate.OM_Surname}`,
      totals: getPractitionerTotals(practitionerTemplate),
      grade: gradeConversion[practitionerTemplate.OM_Grade_Code],
    }
  )
}

const generateTeam = (noOfProbationPractitioners, teamCode, OM_KeyPrefix) =>
  [...new Array(noOfProbationPractitioners)].map((_currentValue, index) => generateProbationPractitioner(index, teamCode, OM_KeyPrefix))

module.exports = {
  generateTeam,
  generateServiceUsers,
  calculateNextChange,
  calculateTotalReductions,
  calculatePointsAvailable,
  calculatePointsUsed,
  updateProbationPractitioner
}
