const router = require('express').Router()
const { body, validationResult } = require('express-validator')
const generateData = require('../views/allocations/0/generateData')

const today = Date.now()

const getErrorMessages = req => {
  const errors = validationResult(req)
  if(errors.isEmpty()) return null
  return errors.array().reduce((current, { param, msg }) => {
    if (!current[param]) current[param] = []
    current[param].push(msg)
    return current
  }, {})
}
const getUser = (crn, serviceUsers) => {
  const serviceUser = serviceUsers.find(({ crn:userCrn }) => crn === userCrn)
  return { serviceUser, crn }
}
const getPractitioner = (findId, probationPractitioners) => {
  return probationPractitioners.find(({ id }) => id == findId)
}

const getUserAndPractitioner = (crn, serviceUsers, probationPractitioners) => {
  const { serviceUser } = getUser(crn, serviceUsers)
  if(!serviceUser) return { crn }
  const probationPractitioner = getPractitioner(serviceUser.currentOM, probationPractitioners)
  return { serviceUser, probationPractitioner, crn }
}

router.use('*', (req, res, next) => {
    const { session: { data }, originalUrl, protocol } = req
    if( Object.keys(data).length == 0 || !data.serviceUsers ) {
      console.log(`**** Resetting all session data ****`)
      data.beginningOfTime = today
      const { serviceUsers, probationPractitioners } = generateData()
      data.serviceUsers = serviceUsers
      data.probationPractitioners = probationPractitioners
    }
    const currentPageUrl = `${protocol}://${req.get('host')}${originalUrl}`
    if(data.originalUrl !== currentPageUrl){
      data.back = data.originalUrl || '/'
      data.originalUrl = currentPageUrl
    }
    next()
  }
)

router.get('/practitioner/:id',({ session: { data: { serviceUsers, probationPractitioners } }, params: { id } }, res) => {
    res.render('allocations/0/practitioner', { 
      probationPractitioners,
      probationPractitioner: getPractitioner(id, probationPractitioners), 
      currentServiceUsers: serviceUsers.filter( ({ currentOM }) => currentOM == id),
      previousServiceUsers: serviceUsers.filter( ({ previousOM }) => previousOM == id)
    })
  })

router.route('/service-user/:crn')
  .get(({ session: { data: { serviceUsers, probationPractitioners } }, params: { crn } }, res) => {
    res.render('allocations/0/service-user', { ...getUserAndPractitioner(crn, serviceUsers, probationPractitioners) })
  })
  .post([body('transfer-reason', 'Please give reasons for transfer request').notEmpty()],
    (req, res) => {
      const { session: { data: { serviceUsers, probationPractitioners } }, params: { crn } } = req
      const errors = getErrorMessages(req)
      if (errors) {
        return res.render('allocations/0/service-user', { errors, ...getUserAndPractitioner(crn, serviceUsers, probationPractitioners) })
      }
      getUser(crn, serviceUsers).serviceUser.transferred = true
      return res.redirect(`/allocations/0/success/${crn}`)
    }
  )

router.route('/new-service-user/:crn')
  .get(({ session: { data: { serviceUsers } }, params: { crn } }, res) => {
    res.render('allocations/0/new-service-user', { ...getUser(crn, serviceUsers) })
  })
  .post([body('serviceUserAction', 'Please select an action').isIn(['accept', 'reject'])],
    (req, res) => {
      const { session: { data }, body: { serviceUserAction }, params: { crn } } = req
      const errors = getErrorMessages(req)
      if (errors) {
        return res.render('allocations/0/new-service-user', { errors, ...getUser(crn, data.serviceUsers) })
      }
      if(serviceUserAction === 'accept') return res.redirect(`/allocations/0/allocate/${crn}`)
      if(serviceUserAction === 'reject') {
        getUser(crn, data.serviceUsers).serviceUser.rejected = true
        return res.redirect(`/allocations/0/success/${crn}`)
      }
    }
  )

router.route('/allocate/:crn')
  .get(({ session: { data: { serviceUsers, probationPractitioners } }, params: { crn }, query }, res) => {
    res.render('allocations/0/allocate', { query, probationPractitioners, ...getUser(crn, serviceUsers) })
  })
  .post([body('allocate-OM', 'Please select an officer').isInt()],
    (req, res) => {
      const { body,  session: { data: { serviceUsers, probationPractitioners } }, params: { crn }, query } = req
      const errors = getErrorMessages(req)
      const { serviceUser } = getUser(crn, serviceUsers)
      if (errors) {
        return res.render('allocations/0/allocate', { errors, query, probationPractitioners, crn, serviceUser })
      }
      const allocateOM = body['allocate-OM']
      //const probationPractitioner = getPractitioner(allocateOM, probationPractitioners)
      serviceUser.previousOM = serviceUser.currentOM || serviceUser.previousOM
      serviceUser.currentOM = allocateOM
      //probationPractitioner.lastAllocated = 
      return res.redirect(`/allocations/0/success/${crn}`)
    }
  )

router.get('/success/:crn', ({ params: { crn }, session: { data: { serviceUsers, probationPractitioners } }, query }, res) => {
  const { serviceUser } = getUser(crn, serviceUsers)
  if(serviceUser.rejected) return res.render('allocations/0/success', { query, crn, serviceUser })
  return res.render('allocations/0/success', { query, serviceUser, crn, probationPractitioner: getPractitioner(serviceUser.currentOM, probationPractitioners) })
})

router.get('*', ({ session: { data: { probationPractitioners, serviceUsers } }, path, query }, res) => {
  const todaysDate = new Date(today).toLocaleDateString('en-GB', {day: "numeric", month: "long", year: "numeric"})
  const lastAllocated = probationPractitioners.reduce((current, { lastAllocated = 0 }) => {
    return new Date(current) > new Date(lastAllocated) ? current : lastAllocated
  })
  const lastUpdateDate = new Date(lastAllocated).toLocaleDateString('en-GB', {day: "numeric", month: "long", year: "numeric"})
  res.render(`allocations/0${path}`, { query, serviceUsers: serviceUsers.filter(({ rejected, transferred }) => !rejected && !transferred), todaysDate, lastUpdateDate, probationPractitioners })
})

module.exports = router
