/* eslint-env mocha */

'use strict'

const process = require('process')
const chai = require('chai')
const expect = chai.expect

const MysticTaiga = require('./../src')

let mystic

describe('Run some basic mysticism', function () {
  this.timeout(5000)

  it('Get a new Mystic Taiga instance)', function () {
    mystic = new MysticTaiga(
      {
        username: process.env.TAIGA_USERNAME,
        password: process.env.TAIGA_PASSWORD,
        project: process.env.TAIGA_PROJECT,
        outputPath: process.env.TAIGA_OUTPUT_PATH
      }
    )
  })

  it('Get a token', async () => {
    await mystic.connect()
  })

  it('Get a project', async () => {
    await mystic.getProject()
  })

  it('Get points', async () => {
    await mystic.getPoints()
  })

  it('Get epics', async () => {
    await mystic.getEpics()
  })

  it('Get stories', async () => {
    await mystic.getUserStories()
  })

  it('Write raw file', () => {
    mystic.writeRawFile()
  })

})
