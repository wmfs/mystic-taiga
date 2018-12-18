# mystic-taiga

> A tool for conjuring delivery dates from Taiga projects.

* Will produce reports a [bit like this](https://wmfs.github.io/mystic-taiga/).

## <a name="install"></a>Install
```bash
git clone https://github.com/wmfs/mystic-taiga.git
cd mystic-taiga
npm install
```

## Typical Usage

### Env variables

Set the following...

| Environment variable  | Notes     |
| --------------------  | --------- |
| `TAIGA_USERNAME`      | An email address will work. |
| `TAIGA_PASSWORD`      | Possibly your GitHub one? |
| `TAIGA_PROJECT`       | For example: `chriskeep-tymly` |
| `TAIGA_SPRINT_EPOCH`  | When the first sprint began... e.g. `2018-06-21T00:00:00.000Z` |
| `TAIGA_SPRINT_DAYS`   | Duration of calendar days that each sprint lasts, e.g. `14` |


**Then:**

```bash
npm run generate
```

### Output

Success looks like...

* A dump of API data in `/test/output/raw.json`
* A freshly generated HTML report in `/docs/index.html`

### Publishing to GitHub pages

``` bash
git add .
git oommit -m "Refreshed data"
git push
```

## Testing

Same environment variables as above, but with the added:
| Environment variable  | Notes     |
| --------------------  | --------- |
| `TAIGA_DIR`           | Where temp files/reports etc. will be written to, relative to project root... e.g. `./test/output` |

``` bash
npm test
```

## <a name="license"></a>License
[MIT](https://github.com/wmfs/mystic-taiga/blob/master/LICENSE)
