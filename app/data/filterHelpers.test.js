const moment = require("moment")
const { getTeamTotals, getPractitionerTotals, getPractitioner, allocateServiceUser, reAllocateServiceUser, getTierReceivingFromKey, getReductionSummary } = require('./filterHelpers')
const { serviceUsers, probationPractitioners } = require('./filterHelpersTestData.json')

describe('calculate team totals', () => {
  let teamTotals
  beforeEach(() => {
    teamTotals = getTeamTotals([ ...probationPractitioners, ...probationPractitioners, ...probationPractitioners ])
  })
  it('should calculate the total cases', () => {
    expect(teamTotals).toEqual( expect.objectContaining( { total: 213 } ))
  })
  it('should calculate the total community, custody and licence cases', () => {
    expect(teamTotals).toEqual( expect.objectContaining( { 
      community: 51,
      custody: 99,
      licence: 63
    } ))
  })
  it('should calculate the total number of cases by tier and origin', () => {
    expect(teamTotals).toEqual( expect.objectContaining( { 
      CommTier0: 0,
      CommTierA: 0,
      CommTierB1: 18,
      CommTierB2: 12,
      CommTierC1: 18,
      CommTierC1a: 0,
      CommTierC2: 3,
      CommTierD1: 0,
      CommTierD1a: 0,
      CommTierD2: 0,
      CommTierE: 0,
      CommTierF: 0,
      CommTierG: 0,
      CustTier0: 0,
      CustTierA: 3,
      CustTierB1: 45,
      CustTierB2: 42,
      CustTierC1: 6,
      CustTierC2: 3,
      CustTierD1: 0,
      CustTierD2: 0,
      CustTierE: 0,
      CustTierF: 0,
      CustTierG: 0,
      D1: 0,
      D1a: 0,
      D2: 0,
      E: 0,
      F: 0,
      G: 0,
      LicenceTier0: 0,
      LicenceTierA: 0,
      LicenceTierB1: 27,
      LicenceTierB2: 12,
      LicenceTierC1: 21,
      LicenceTierC2: 3,
      LicenceTierD1: 0,
      LicenceTierD2: 0,
      LicenceTierE: 0,
      LicenceTierF: 0,
      LicenceTierG: 0,
    } ))
  })
  it('should calculate the total number of cases by tier', () => {
    expect(teamTotals).toEqual( expect.objectContaining( {
      '0': 0,
      A: 3,
      B1: 90,
      B2: 66,
      C1: 45,
      C1a: 0,
      C2: 9,
      D1: 0,
      D1a: 0,
      D2: 0,
      E: 0,
      F: 0,
      G: 0,
    } ))
  })
})

describe('calculate probation practitioner totals', () => {
  let practitionerTotals
  beforeEach(() => {
    practitionerTotals = getPractitionerTotals(probationPractitioners[0])
  })
  it('should calculate the total cases', () => {
    expect(practitionerTotals).toEqual( expect.objectContaining( { total: 40 } ))
  })
  it('should calculate the total community, custody and licence cases', () => {
    expect(practitionerTotals).toEqual( expect.objectContaining( { 
      community: 6,
      custody: 24,
      licence: 10
    } ))
  })
  it('should calculate the total number of cases by tier', () => {
    expect(practitionerTotals).toEqual( expect.objectContaining( {
      '0': 0,
      A: 0,
      B1: 16,
      B2: 12,
      C1: 11,
      C1a: 0,
      C2: 1,
      D1: 0,
      D1a: 0,
      D2: 0,
      E: 0,
      F: 0,
      G: 0,
    } ))
  })
})

describe('get probation practitioner', () => {
  let practitioner
  beforeEach(() => {
    practitioner = getPractitioner('key2', probationPractitioners)
  })
  it('should return the probation practitioner', () => {
    expect(practitioner).toEqual( probationPractitioners[1])
  })
})

describe('getTierReceivingFromKey', () => {
  it('should add the service user to the probation practitioner', () => {
    expect(getTierReceivingFromKey(serviceUsers[0])).toEqual('CommTierB2')
  })
})

describe('allocate service user', () => {
  let team
  let newProbationOfficer
  let serviceUser
  beforeEach(() => {
    Date.now = jest.fn().mockReturnValue(new Date('2020-05-13T12:33:37.000Z'))
    newProbationOfficer = { ...probationPractitioners[2] }
    newProbationOfficer.serviceUsers = []
    team = [ { ...probationPractitioners[0] }, { ...probationPractitioners[1] }, newProbationOfficer ]
    serviceUser = { ...serviceUsers[2] }
    allocateServiceUser('crn3', [ { ...serviceUsers[0] }, { ...serviceUsers[1] }, serviceUser ], 'key3', team)
  })
  afterEach(() => {
    jest.restoreAllMocks()
  })
  it('should add the service user to the probation practitioner', () => {
    expect(newProbationOfficer.serviceUsers).toEqual( [serviceUser])
  })
  it('should update the from tier count', () => {
    expect(newProbationOfficer.LicenceTierA).toEqual(1)
  })
  it('should update the last allocated date', () => {
    expect(newProbationOfficer.lastAllocated).toEqual(moment())
  })
})

describe('reAllocate service user', () => {
  let team
  let serviceUser
  let previousProbationOfficer
  let newProbationOfficer
  beforeEach(() => {
    Date.now = jest.fn().mockReturnValue(new Date('2020-05-13T12:33:37.000Z'))
    serviceUser = { ...serviceUsers[2] }
    newProbationOfficer = { ...probationPractitioners[2] }
    newProbationOfficer.serviceUsers = []
    previousProbationOfficer = { ...probationPractitioners[0] }
    previousProbationOfficer.serviceUsers = []
    previousProbationOfficer.serviceUsers.push(serviceUser)
    previousProbationOfficer.LicenceTierA = 1
    team = [ previousProbationOfficer, { ...probationPractitioners[1] }, newProbationOfficer ]
    reAllocateServiceUser(serviceUser.crn, 'key3', team)
  })
  afterEach(() => {
    jest.restoreAllMocks()
  })
  describe('remove the service user from the incumbent probation practitioner', () => {
    it('should remove the service user from the probation practitioner', () => {
      expect(previousProbationOfficer.serviceUsers.length).toBe(0)
    })
    it('should update the from tier count', () => {
      expect(previousProbationOfficer.LicenceTierA).toEqual(0)
    })
  })
  describe('allocate to probation practitioner', () => {
    it('should add the service user to the probation practitioner', () => {
      expect(newProbationOfficer.serviceUsers).toEqual( [serviceUser] )
    })
    it('should update the from tier count', () => {
      expect(newProbationOfficer.LicenceTierA).toEqual(1)
    })
    it('should update the last allocated date', () => {
      expect(newProbationOfficer.lastAllocated).toEqual(moment())
    })
  })
})

describe('get probation practitioner reduction summary', () => {
  let reductionSummary
  let probationPractitioner
  beforeEach(() => {
    probationPractitioner = {
      reductions: [
        { hours:29.6, start:moment('2021-03-19T00:00:00.000Z'), end:moment('2021-07-19T01:00:00.000Z'), status: 'ACTIVE' },
        { hours:22.2, start:moment('2021-07-20T01:00:00.000Z'), end:moment('2021-11-20T00:00:00.000Z'), status: 'SCHEDULED' },
        { hours:14.8, start:moment('2021-11-21T00:00:00.000Z'), end:moment('2022-03-21T00:00:00.000Z'), status: 'DELETED' },
        { hours:14.8, start:moment('2021-11-21T00:00:00.000Z'), end:moment('2022-04-21T01:00:00.000Z'), status: 'SCHEDULED' }
      ],
    }
  })
  describe('when the status are all still valid', () => {
    beforeEach(() => {
      reductionSummary = getReductionSummary(probationPractitioner, moment('2021-07-18T01:00:00.000Z'))
    })
    it('should group reductions by status', () => {
      const { scheduledReductions, activeReductions, archivedReductions, deletedReductions } = reductionSummary
      expect(scheduledReductions.length).toEqual( 2 )
      expect(activeReductions.length).toEqual( 1 )
      expect(archivedReductions.length).toEqual( 0 )
      expect(deletedReductions.length).toEqual( 1 )
    })
  })
})
