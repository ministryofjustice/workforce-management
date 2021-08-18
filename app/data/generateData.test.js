const { 
  generateTeam, 
  generateServiceUsers, 
  calculatePointsUsed, 
  calculateNextChange, 
  calculateTotalReductions, 
  calculatePointsAvailable } = require('./generateData')
const { CUSTODY, COMMUNITY } = require('./filterHelpers')
const moment = require("moment")

describe('calculate Points Used', () => {
  it('should calculate the points used for a given probation practitioner', () => {
    expect(calculatePointsUsed(
      {
        "CommTierC2": 1,
        "CustTierC1": 3,
      }
    )).toEqual(122)
  })
})

describe('generate team', () => {

  let generatedData
  beforeEach(() => {
    generatedData = generateTeam(3, 'Team_Code', 'OM_Key')
  })
  it('should return an array with a length equivalent to the number of practitioners', () => {
    expect(generatedData.length).toBe(3)
  })
  it('should return an array of probation practitioners', () => {
    expect(generatedData).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          'OM_Grade_Code': expect.any(String),
          'grade': expect.any(String),
        })
      ])
    )
  })
  describe('generate Probation Practitioner', () => {
    let generatedProbationPractitioner
    beforeEach(() => {
      generatedProbationPractitioner = generatedData[0]
    })
    it('should return an probation practitioner object', () => {
      expect(generatedProbationPractitioner).toMatchObject({
        'OM_Surname': expect.any(String),
        'OM_Forename': expect.any(String),
        'Team_Code': 'Team_Code',
        'OM_Key': 'OM_Key00',
      })
    })
    describe('generating service users from probation practitioners', () => {
      it('should generate service users for a probation practitioner', () => {
        expect(generatedProbationPractitioner).toMatchObject({
          'serviceUsers': expect.any(Array),
        })
      })
    })
    describe('generating service users', () => {
      let generatedServiceUsers
      beforeEach(() => {
        generatedServiceUsers = generateServiceUsers("N57A301", { "CustTierC1": 1, "CommTierC2": 2 })
      })
      it('should generate the correct number of service users', () => {
        expect(generatedServiceUsers.length).toEqual(3)
      })
      it('should generate the different users based on tier information', () => {
        expect(generatedServiceUsers).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              'tier': 'C1',
              'receivingFrom': CUSTODY,
              'name': expect.any(String),
              'postcode': expect.any(String),
              'crn': expect.any(String),
              'pnc': expect.any(String),
            }),
            expect.objectContaining({
              'tier': 'C2',
              'receivingFrom': COMMUNITY,
            }),
            expect.objectContaining({
              'tier': 'C2',
              'receivingFrom': COMMUNITY,
            }),
          ])
        )
      })
    })
  })
})

describe('get probation practitioner reduction summary', () => {
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
  describe('when calculating the total reduction hours', () => {
    it('should return the total hours reduction', () => {
      expect(calculateTotalReductions(probationPractitioner, moment('2021-07-18T01:00:00.000Z'))).toEqual( 29.6 )
      expect(calculateTotalReductions(probationPractitioner, moment('2021-08-20T01:00:00.000Z'))).toEqual( 22.2 )
    })
  })
  describe('when calculating the next change in reduction hours', () => {
    it('should return the date of the next change', () => {
      expect(calculateNextChange(probationPractitioner, moment('2021-07-18T01:00:00.000Z')).isSame('2021-07-19T01:00:00.000Z')).toEqual( true )
      expect(calculateNextChange(probationPractitioner, moment('2021-08-20T01:00:00.000Z')).isSame('2021-11-20T00:00:00.000Z')).toEqual( true )
    })
  })
})
