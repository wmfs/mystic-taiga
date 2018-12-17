# mystic-taiga


> A tool for conjuring delivery dates for Taiga projects.

## <a name="install"></a>Install
```bash
$ npm install mystic-taiga --save
```

## Environment

Set-up some environment variables:

| Environment variable  | Notes     |
| --------------------  | --------- |
| `TAIGA_USERNAME`      | An email address will work. |
| `TAIGA_PASSWORD`      | Possibly your GitHub one? |
| `TAIGA_PROJECT`       | For example: `chriskeep-tymly` |
| `TAIGA_DIR`           | Where temp riles/reports etc. will be written to, relative to project root... e.g. `./test/output` |
| `TAIGA_SPRINT_EPOCH`  | When the first sprint began... e.g. `21-JUN-2018` |
| `TAIGA_SPRINT_DAYS`   | Duration of calendar days that each sprint lasts, e.g. `14` |

## <a name="license"></a>License
[MIT](https://github.com/wmfs/mystic-taiga/blob/master/LICENSE)
