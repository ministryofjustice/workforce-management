const moment = require("moment")
const tierConversion = require('./tier_conversion.json')
const CUSTODY = 'custody'
const COMMUNITY = 'community'
const LICENSE = 'licence'
const ARCHIVED = 'ARCHIVED'
const DELETED = 'DELETED'
const ACTIVE = 'ACTIVE'
const SCHEDULED = 'SCHEDULED'

const getTeamTotals = team => {
  const tierConversionKeys = Object.keys(tierConversion)
  const tierOriginTotals = Object.fromEntries(tierConversionKeys.map(tierKey => ([ [tierKey], 0 ])))
  const tierConversionValues = Object.values(tierConversion)
  const tierTotals = Object.fromEntries(tierConversionValues
    .map(tierKey => tierKey.tier)
    .filter((tier, index, self) => self.indexOf(tier) === index)
    .map(tierKey => ([tierKey, 0]))
  )
  return  team.reduce( (totals, po) => {
    tierConversionKeys.forEach( tierKey => {
      const receivingFrom = tierConversion[tierKey].receivingFrom.toLowerCase()
      const tierValue = po[tierKey] || 0
      totals[tierKey] += tierValue
      totals[tierConversion[tierKey].tier] += tierValue
      totals.total += tierValue
      switch(receivingFrom){
        case CUSTODY:
          totals[CUSTODY] += tierValue
          break
        case COMMUNITY:
          totals[COMMUNITY] += tierValue
          break
        case LICENSE:
          totals[LICENSE] += tierValue
          break
        default:
          console.log(receivingFrom)
      }
    })
    return totals
  }, { total: 0, [CUSTODY]: 0, [COMMUNITY]: 0, [LICENSE]: 0, ...tierOriginTotals, ...tierTotals } )
}

const getPractitionerTotals = po => getTeamTotals([po])
const getPractitioner = (omKey , team) => team.find(({ OM_Key }) => omKey === OM_Key)
const getTierReceivingFromKey = ({ tier:serviceUserTier, receivingFrom:serviceUserReceivingFrom }) => 
  Object.keys(tierConversion)[Object.values(tierConversion).findIndex(
    ({ tier, receivingFrom }) => serviceUserTier === tier && receivingFrom === serviceUserReceivingFrom 
  )]
const abstractAllocateServiceUser = (serviceUser, probationPractitioner, tierReceivingFromKey) => {
  probationPractitioner.serviceUsers.push(serviceUser)
  probationPractitioner[tierReceivingFromKey] = (probationPractitioner[tierReceivingFromKey] || 0) + 1
  probationPractitioner.lastAllocated = moment()
}
const allocateServiceUser = (serviceUserCrn, newServiceUsers, omKey, team) => {
  const serviceUser = newServiceUsers.find(({ crn }) => crn === serviceUserCrn )
  const probationPractitioner = getPractitioner(omKey, team)
  const tierReceivingFromKey = getTierReceivingFromKey(serviceUser)
  abstractAllocateServiceUser(serviceUser, probationPractitioner, tierReceivingFromKey)
}
const reAllocateServiceUser = (serviceUserCrn, omKey, team) => {
  team.find((probationPractitioner) => {
    const { serviceUsers, OM_Key } = probationPractitioner
    const index = serviceUsers.findIndex(({ crn }) => crn === serviceUserCrn)
    if(index > -1) {
      const serviceUser = serviceUsers[index]
      if(!serviceUser.previousProbationOfficer) serviceUser.previousProbationOfficer = []
      serviceUser.previousProbationOfficer.push(OM_Key)
      serviceUsers.splice(index, 1)
      const tierReceivingFromKey = getTierReceivingFromKey(serviceUser)
      probationPractitioner[tierReceivingFromKey] -= 1
      abstractAllocateServiceUser(serviceUser, getPractitioner(omKey, team), tierReceivingFromKey)
      return true
    }
  })
}
const getReductionSummary = ({ contractedHours, reductions }, now = moment()) => {
  const scheduledReductions = reductions.filter(({ status }) => status === SCHEDULED)
  const activeReductions = reductions.filter(({ status }) => status === ACTIVE)
  const archivedReductions = reductions.filter(({ status }) => status === ARCHIVED)
  const deletedReductions = reductions.filter(({ status }) => status === DELETED)
  return { scheduledReductions, activeReductions, archivedReductions, deletedReductions }
}

const filterBetweenTimePeriod = (serviceUsers, key, daysBefore = 0, daysAfter = 28) => {
  const momentSince = moment().subtract(daysBefore, 'days')
  const momentTo = moment().add(daysAfter, 'days')
  return serviceUsers.filter( (su) => su[key].isBetween(momentSince, momentTo))
    .sort((suA, suB) => moment.utc(suA[key].timeStamp).diff(moment.utc(suB[key].timeStamp)))
}

const getCasesDueToEnd = ({ serviceUsers }, daysBefore = 0, daysAfter = 28) => {
  return filterBetweenTimePeriod(serviceUsers, 'caseEndDate', daysBefore, daysAfter)
}

const getSentencesDueToEnd = ({ serviceUsers }, daysBefore = 0, daysAfter = 28) => {
  return filterBetweenTimePeriod(serviceUsers, 'sentenceEnd', daysBefore, daysAfter)
}

const getParoleReportsDue = ({ serviceUsers }, daysBefore = 0, daysAfter = 28) => {
  return filterBetweenTimePeriod(serviceUsers, 'paroleReportDueDate', daysBefore, daysAfter)
}

module.exports = { 
  getPractitionerTotals, 
  getTeamTotals, 
  getPractitioner, 
  allocateServiceUser, 
  reAllocateServiceUser,
  getReductionSummary,
  getCasesDueToEnd,
  getSentencesDueToEnd,
  getParoleReportsDue,
  abstractAllocateServiceUser, //included for testing only
  getTierReceivingFromKey, //included for testing only
  ARCHIVED,
  DELETED,
  ACTIVE,
  SCHEDULED,
  CUSTODY,
  COMMUNITY,
  LICENSE,
}

