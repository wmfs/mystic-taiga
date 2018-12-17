const axios = require('axios')
const BASE_URL = 'https://api.taiga.io/api/v1/'
const fs = require('fs')
const path = require('path')

class MysticTaiga {
  constructor (options) {
    this.options = options
    this.raw = {}
  }

  async connect () {
    return axios.post(
      BASE_URL + 'auth',
      {
        type: 'normal',
        username: this.options.username,
        password: this.options.password
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    ).then(
      (res) => {
        this.token = res.data.auth_token
        this.email = res.data.email
      }
    )
  }

  headers () {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.token}`,
      'x-disable-pagination': 'True'
    }
  }

  async getProject () {
    const _this = this
    return axios.get(
      BASE_URL + 'projects/by_slug',
      {
        headers: this.headers(),
        params: {
          slug: this.options.project
        }
      }
    ).then(
      (res) => {
        _this.raw.project = res.data
      }
    )
  }

  async getEpics () {
    const _this = this
    return axios.get(
      BASE_URL + 'epics',
      {
        headers: this.headers(),
        params: {
          project: this.raw.project.id
        }
      }
    ).then(
      (res) => {
        _this.raw.epics = res.data
      }
    )
  }

  async getPoints () {
    const _this = this
    return axios.get(
      BASE_URL + 'points',
      {
        headers: this.headers(),
        params: {
          project: this.raw.project.id
        }
      }
    ).then(
      (res) => {
        _this.raw.points = res.data
      }
    )
  }

  async getUserStories () {
    const _this = this
    return axios.get(
      BASE_URL + 'userstories',
      {
        headers: this.headers(),
        params: {
          project: this.raw.project.id
        }
      }
    ).then(
      (res) => {
        _this.raw.stories = res.data
      }
    )
  }

  writeRawFile () {
    fs.writeFileSync(
      path.resolve(__dirname, this.options.outputPath),
      JSON.stringify(this.raw, null, 2)
    )
  }
}

module.exports = MysticTaiga
