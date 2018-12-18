const process = require('process')
const MysticTaiga = require('./../src')
const path = require('path')

async function main () {
  console.log('Generating...')
  const workingDir = path.resolve(__dirname, '../test/output')
  const outputDir = path.resolve(__dirname, '../docs')
  const mystic = new MysticTaiga(
    {
      username: process.env.TAIGA_USERNAME,
      password: process.env.TAIGA_PASSWORD,
      project: process.env.TAIGA_PROJECT,
      sprintEpoch: process.env.TAIGA_SPRINT_EPOCH,
      sprintDays: parseInt(process.env.TAIGA_SPRINT_DAYS),
      workingDir: workingDir,
      outputDir: outputDir
    }
  )

  await mystic.connect()

  console.log('Getting project data')
  await mystic.getProject()

  console.log('Getting points')
  await mystic.getPoints()

  console.log('Getting Epics')
  await mystic.getEpics()

  console.log('Getting User Stories')
  await mystic.getUserStories()

  console.log(`Writing raw file to ${workingDir}`)
  mystic.writeRawFile()

  console.log('Processing raw API data')
  mystic.processRaw()

  console.log(`Writing report to ${outputDir}`)
  mystic.writeReport()

  console.log('Done.')
}

(async () => {
  await main()
})().catch(e => {
  // Deal with the fact the chain failed
  console.error(e)
})
