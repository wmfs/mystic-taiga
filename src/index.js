const axios = require('axios')
const BASE_URL = 'https://api.taiga.io/api/v1/'
const _ = require('lodash')
const fs = require('fs')
const path = require('path')
const ejs = require('ejs')

const DUE_DATE_STATUSES_TO_IGNORE = ['not_set', 'no_longer_applicable']
const BACKLOG_STATUSES = ['Backlog', 'Ready']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

class MysticTaiga {
  constructor (options) {
    this.options = options
    this.raw = {}
    this.processed = {}
    this.rawPath = path.resolve(__dirname, '../', this.options.workingDir, 'raw.json')
    this.reportPath = path.resolve(__dirname, '../', this.options.outputDir || this.options.workingDir, 'index.html')
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
    fs.writeFileSync(this.rawPath, JSON.stringify(this.raw, null, 2))
  }

  readRawFile () {
    const content = fs.readFileSync(this.rawPath)
    this.raw = JSON.parse(content)
  }

  processStories () {
    this.sprints = []
    this.dueDates = []
    this.raw.stories.forEach(
      (story) => {
        // Tuck away a due-by date
        const dueStatus = story.due_date_status
        if (DUE_DATE_STATUSES_TO_IGNORE.indexOf(dueStatus) === -1) {
          this.dueDates.push(
            {
              projectId: story.id,
              projectSubject: story.subject,
              due_date: story.due_date,
              due_date_reason: story.due_date_reason,
              due_date_status: dueStatus
            }
          )
        }
      }
    )
  }

  addDays (d, days) {
    return new Date(d.valueOf() + 864E5 * days)
  }

  generateSprints () {
    this.sprints = []
    let i = 0
    const now = new Date()
    let indexOfCurrentSprint
    this.processed.sprints = []
    let sprintStart = new Date(this.options.sprintEpoch)
    while (i < 100) {
      const endDate = new Date(this.addDays(sprintStart, this.options.sprintDays) - 1)
      this.processed.sprints.push(
        {
          index: i,
          startDate: sprintStart,
          startDateLabel: `${sprintStart.getDate()} ${MONTHS[sprintStart.getMonth()]}, ${sprintStart.getFullYear()}`,
          tinyLabel: `${sprintStart.getDate()} ${MONTHS[sprintStart.getMonth()]}`,
          endDate: endDate,
          stories: []
        }
      )

      if (now >= sprintStart && now <= endDate) {
        indexOfCurrentSprint = i

      }
      sprintStart = this.addDays(sprintStart, this.options.sprintDays)
      i++
    }

    this.processed.indexOfCurrentSprint = indexOfCurrentSprint
    this.processed.sprints.forEach(
      (sprint) => {
        sprint.offset = sprint.index - indexOfCurrentSprint
      }
    )
  }

  getValueFromPointId (pointId) {
    let value = null
    this.raw.points.forEach(
      (point) => {
        if (point.id === pointId) {
          value = point.value
        }
      }
    )
    return value
  }

  getDaysFromPoints (points) {
    let totalDays = null
    Object.entries(points).forEach(([roleId, pointId]) => {
      const estimatedDays = this.getValueFromPointId(pointId)
      if (estimatedDays !== null) {
        if (totalDays === null) {
          totalDays = 0
        }
        totalDays += estimatedDays
      }
    })
    return totalDays
  }

  generateBacklog () {
    this.processed.backlog = []
    this.raw.stories.forEach(
      (story) => {
        if (BACKLOG_STATUSES.indexOf(story.status_extra_info.name) !== -1) {
          let epicId = null
          if (story.epics) {
            epicId = story.epics[0].id
          }

          const subset = {
            id: story.id,
            status: story.status_extra_info.name,
            ref: story.ref,
            subject: story.subject,
            blocked: story.is_blocked,
            epicId: epicId,
            kanbanOrder: story.kanban_order,
            estimatedDays: this.getDaysFromPoints(story.points)
          }
          this.processed.backlog.push(subset)
        }
      }
    )
    this.processed.backlog = _.orderBy(
      this.processed.backlog,
      ['kanbanOrder'],
      ['asc']
    )
  }

  assignBacklogToSprints () {
    let runningTotal = 1000
    let sprintIndex = this.processed.indexOfCurrentSprint - 1
    this.processed.backlog.forEach(
      (story) => {
        // Pushing into new sprint...
        if (story.estimatedDays + runningTotal > 40) {
          sprintIndex++
          runningTotal = 0
          // Add a new column to the "Epic Forecast" column for each epic.
          this.processed.epics.forEach(
            (epic) => {
              epic.storyCountsPerSprint.push({
                days: 0
              })
            }
          )
        }
        runningTotal += story.estimatedDays
        this.processed.sprints[sprintIndex].stories.push(story)
        // So the "current sprint" will be the last column in each epic forecast row.
        // So add rhe number of days here to the appropriate epic.#
        if (story.estimatedDays) {
          this.processed.epics.forEach(
            (epic) => {
              let storyEpicId = story.epicId
              if (!storyEpicId) {
                storyEpicId = 0
              }
              if (epic.id === storyEpicId) {
                let lastCell = epic.storyCountsPerSprint[epic.storyCountsPerSprint.length - 1]
                lastCell.days += story.estimatedDays
              }
            }
          )
        }
      }
    )
    this.processed.maxSprintIndex = sprintIndex
  }

  generateEpicSummary () {
    const _this = this
    this.processed.epics = []
    this.raw.epics.forEach((rawEpic) => {

      const points = {
        total: 0,
        closed: 0,
        blocked: 0
      }

      // Scan stories looking for points
      _this.raw.stories.forEach((story) => {
        if (story.epics) {
          const storyEpic = story.epics[0]
          if (storyEpic.id === rawEpic.id) {
            const totalPoints = _this.getDaysFromPoints(story.points)
            if (totalPoints) {
              points.total += totalPoints
              if (story.is_closed) {
                points.closed += totalPoints
              }
              if (story.is_blocked) {
                points.blocked += totalPoints
              }
            }
          }
        }
      })

      this.processed.epics.push(
        {
          id: rawEpic.id,
          ref: rawEpic.ref,
          subject: rawEpic.subject,
          blocked: rawEpic.is_blocked,
          storyCountsPerSprint: [],
          points: points
        }
      )
    })

    this.processed.epics.push(
      {
        id: 0,
        subject: 'Not assigned an epic',
        blocked: 'N/A',
        storyCountsPerSprint: []
      }
    )
  }

  calculateEpicSprintSummary () {
    const numberOfSprints = this.processed.epics[0].storyCountsPerSprint.length
    for (let i = 0; i < numberOfSprints; i++) {
      // First pass... get total days across all epics for a given sprint
      let totalDaysInSprint = 0
      this.processed.epics.forEach(
        (epic) => {
          totalDaysInSprint += epic.storyCountsPerSprint[i].days
        }
      )
      // Second pass now apply a "weight" for each cell.
      this.processed.epics.forEach(
        (epic) => {
          const sprintDays = epic.storyCountsPerSprint[i].days
          let percentage = Math.ceil((sprintDays / totalDaysInSprint) * 100)
          if (percentage > 100) {
            percentage = 100
          }
          let className = 'noDays'
          if (percentage > 0 && percentage < 25) {
            className = 'fewDays'
          } else if (percentage >= 25 && percentage < 50) {
            className = 'reasonableDays'
          } else if (percentage >= 50 && percentage < 75) {
            className = 'busyDays'
          } else if (percentage >= 75) {
            className = 'heavyDays'
          }
          epic.storyCountsPerSprint[i].weight = className
        }
      )
    }
  }

  processRaw () {
    this.processed.generatedTimestamp = new Date().toString()
    this.processed.project = this.raw.project
    this.generateSprints()
    this.generateEpicSummary()
    this.generateBacklog()
    this.assignBacklogToSprints()
    this.calculateEpicSprintSummary()
    this.processed.sprints = this.processed.sprints.slice(this.processed.indexOfCurrentSprint, this.processed.maxSprintIndex + 1)
  }

  writeReport () {
    const template = fs.readFileSync(path.resolve(__dirname, './report.html.ejs')).toString()
    const html = ejs.render(template, this.processed)
    fs.writeFileSync(this.reportPath, html)
  }
}

module.exports = MysticTaiga
