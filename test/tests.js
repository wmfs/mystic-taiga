/* eslint-env mocha */

'use strict'

const process = require('process')
const chai = require('chai')
const expect = chai.expect

const MysticTaiga = require('./../src')

let mystic

describe('Write a raw file', function () {
  this.timeout(5000)

  it('Get a new Mystic Taiga instance)', function () {
    mystic = new MysticTaiga(
      {
        username: process.env.TAIGA_USERNAME,
        password: process.env.TAIGA_PASSWORD,
        project: process.env.TAIGA_PROJECT,
        workingDir: process.env.TAIGA_DIR
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

describe('Read some raw data from a file', function () {
  this.timeout(5000)

  it('Get a new instance', function () {
    mystic = new MysticTaiga(
      {
        username: process.env.TAIGA_USERNAME,
        password: process.env.TAIGA_PASSWORD,
        project: process.env.TAIGA_PROJECT,
        workingDir: process.env.TAIGA_DIR,
        sprintEpoch: process.env.TAIGA_SPRINT_EPOCH,
        sprintDays: parseInt(process.env.TAIGA_SPRINT_DAYS)
      }
    )
  })

  it('Load data from raw file', () => {
    mystic.readRawFile()
  })

  it('Should simplify the raw API data', () => {
    mystic.processRaw()
  })

  it('Should generate an HTML report', () => {
    mystic.writeReport()
  })


})
