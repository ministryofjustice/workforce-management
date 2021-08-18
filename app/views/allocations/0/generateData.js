const { probationPractitioners, serviceUserTemplates, postCodes, forenames, surnames, referenceDate } = require('./data_templates.json')

let serviceUserIndex = 0
const getServiceUserIndex = () => {
  const currentServiceUserIndex = serviceUserIndex
  serviceUserIndex ++
  return currentServiceUserIndex
}

const generateServiceUser = (dates, currentOM = null) => {
  const previousOM = Math.random() > 0.8 ? probationPractitioners[Math.floor(probationPractitioners.length*Math.random())].id :''
  const index = getServiceUserIndex()
  const templateIndex = index % serviceUserTemplates.length
  return { 
    name: `${forenames[index%forenames.length]} ${surnames[index%surnames.length]}`, 
    postcode: postCodes[index%postCodes.length], 
    crn: `J${678911 + (index*3)}`,
    pnc: `2012/${123100000+(index*131)}F`,
    template: serviceUserTemplates[templateIndex],
    dates: dates[templateIndex],
    currentOM: currentOM ? currentOM : '',
    previousOM: previousOM != currentOM ? previousOM : '',
  }
}

const generateNewServiceUsers = (dates, numberOfNewServiceUsers) => {
  return [...new Array(numberOfNewServiceUsers)].map(() => generateServiceUser(dates))
}

const generateAllocatedServiceUsers = (dates, { noOfCases, id }) => {
  return [...new Array(noOfCases)].map(() => generateServiceUser(dates, id))
}

const updateDate = (timeOffSet, timeStamp, param) => {
  const newDate = new Date(new Date(timeStamp).getTime()+timeOffSet)
  return { [`${ param }Raw`]: newDate, [param]: `${ newDate.getDate() } ${newDate.toLocaleDateString('en-GB', { month: "short" }) } ${ newDate.getFullYear() }` }
}

const createDates = (timeOffSet, templateDates) => templateDates.map(({ sentenceStart, sentenceEnd }) => (
  { ...updateDate(timeOffSet, sentenceStart, 'sentenceStart'), ...updateDate(timeOffSet, sentenceEnd, 'sentenceEnd') }
))

const generateAllServiceUsers = (dates, newDates, numberOfNewServiceUsers = 7) => probationPractitioners
  .flatMap(probationPractitioner => generateAllocatedServiceUsers(dates, probationPractitioner))
  .concat(generateNewServiceUsers(newDates, numberOfNewServiceUsers))

const generateServiceUsers = (referenceDateMilliseconds, timeOffSet) => {
  const addDays = days => referenceDateMilliseconds + (days * 86400000)
  const rawNewDates = serviceUserTemplates.map(({ sentenceEnd }, index) => ({ sentenceEnd, sentenceStart: addDays(Math.ceil((index/serviceUserTemplates.length)*5)) }))
  const newDates = createDates(timeOffSet, rawNewDates)
  newDates.forEach(newDate => newDate.sla = Math.round((new Date(newDate.sentenceStart).getTime()-(referenceDateMilliseconds+timeOffSet))/86400000) )
  return generateAllServiceUsers(createDates(timeOffSet, serviceUserTemplates), newDates)
}

const generateData = () => {
  const referenceDateMilliseconds = new Date(referenceDate).getTime()
  const timeOffSet = Date.now() - referenceDateMilliseconds
  return { 
    serviceUsers: generateServiceUsers(referenceDateMilliseconds, timeOffSet), 
    probationPractitioners: probationPractitioners.map(probationPractitioner => ({ ...probationPractitioner, ...updateDate(timeOffSet, probationPractitioner.lastAllocated, 'lastAllocated') }))
  }
}

module.exports = generateData
