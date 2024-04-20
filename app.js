const express = require('express')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')

const databasePath = path.join(__dirname, 'covid19India.db')

const app = express()
app.use(express.json())
let database = null

const initializeDb = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () =>
      console.log('Server Running at https://localhost/:3000'),
    )
  } catch (error) {
    console.log(`DB Error : ${error.message}`)
    process.exit(1)
  }
}

initializeDb()

const convertStateDbObjectToResponseObject = dbObject => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  }
}

const convertDistrictDbObjectToResponseObject = dbObject => {
  return {
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    stateId: dbObject.state_id,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  }
}

// APL 1

app.get('/states/', async (request, response) => {
  const getStatesQuery = `
    select
        *
    from 
        state
    order by state_id;`
  const stateList = await database.all(getStatesQuery)
  const stateResult = stateList.map(eachObject => {
    return convertStateDbObjectToResponseObject(eachObject)
  })
  response.send(stateResult)
})

// APL 2

app.get('/states/:stateId/', async (request, response) => {
  const {stateId} = request.params
  const getStates = `
  select
    *
  from
    state
  where
    state_id = ${stateId};`
  const newState = await database.get(getStates)
  const stateResult = convertStateDbObjectToResponseObject(newState)
  response.send(stateResult)
})

// APL 3

app.post('/districts/', async (request, response) => {
  const createDistrict = request.body
  const {districtName, stateId, cases, cured, active, deaths} = createDistrict
  const newDistrict = `
  insert into
    district(district_name,state_id,cases,cured,active,deaths)
  values
    ('${districtName}',
    ${stateId},
    ${cases},
    ${cured},
    ${active},
    ${deaths});`
  const addDistrict = await database.run(newDistrict)
  const districtId = addDistrict.lastId
  response.send('District Successfully Added')
})

// APL 4

app.get('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const getDistrict = `
    select
      *
    from
      district
    where district_id = ${districtId};`
  const newDistrict = await database.get(getDistrict)
  const districtResult = convertDistrictDbObjectToResponseObject(newDistrict)
  response.send(districtResult)
})

// APL 5

app.delete('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const deleteDistrict = `
    delete
      from
    district
    where district_id = ${districtId};`
  await database.run(deleteDistrict)
  response.send('District Removed')
})

// APL 6

app.put('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params;
  const districtDetails = request.body
  const {districtName, stateId, cases, cured, active, deaths} = districtDetails
  const updateDistrict = `
    update
      district
    set
      district_name = '${districtName}',
      state_id = ${stateId},
      cases = ${cases},
      cured = ${cured},
      active = ${active},
      deaths = ${deaths}
    where district_id = ${districtId};`
  await database.run(updateDistrict)
  response.send('District Details Updated')
})

// APl 7

app.get('/states/:stateId/stats/', async (request, response) => {
  const {stateId} = request.params
  const getStateReport = `
  select 
      sum(cases) as cases,
      sum(cured) as cured,
      sum(deaths) as deaths
  from
    district
  where state_id = ${stateId};`
  const stateReport = await database.get(getStateReport)
  const resultReport = convertStateDbObjectToResponseObject(stateReport)
  response.send(resultReport)
})

// APL 8

app.get('/districts/:districtId/details/', async (request, response) => {
  const {districtId} = request.params
  const stateDetails = `
  select state_name
  from state join district
    on state.state_id = district.state_id
  where district.district_id = ${districtId};`
  const stateName = await database.get(stateDetails)
  response.send({stateName: stateName.state_name})
})

module.exports = app
