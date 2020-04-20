import { delimiter, normalize } from 'path'

import repl from 'repl'

import './z-mods'

import { WELCOME_TEXT, REPL_HISTORY_PATH, PKG_BIN_DIR } from './settings'

process.env.PATH = `${ normalize(PKG_BIN_DIR) }${ delimiter }${ process.env.PATH }`

const [ , , scriptName, code ] = process.argv

if (scriptName === '-e' && code) {
  z.pkg.runScript(code)
    .then(() => process.exit())
    .catch(error => {
      console.error(error)
      process.exit(1)
    })
} else if (scriptName) {
  z.pkg.execute(scriptName)
    .then(() => process.exit())
    .catch(error => {
      console.error(error)
      process.exit(1)
    })
} else {
  console.log(WELCOME_TEXT)
  repl.start({})
    .setupHistory(REPL_HISTORY_PATH, error => {
      if (error) {
        console.error(error)
      }
    })
}
