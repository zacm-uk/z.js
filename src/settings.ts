import { join } from 'path'
import { homedir } from 'os'
import { mkdirSync, existsSync } from 'fs-extra'

export const VERSION = '1.0.0'
export const NAME = 'z.js'

export const WELCOME_TEXT = `Z Node OS ${ VERSION }
This repl is the exact same as 'node' with --experimental-repl-await enabled to allow the use of 'await'.
The differences are in the package management, 'z.pkg' is the package manager.

z.pkg is intended to be used instead of 'npm' for node modules, continue to 'require' core modules such as 'https' and 'crypto'.
A package is a single JavaScript file, any dependencies should be uploaded to z.pkg and required using z.pkg.require.

All z.pkg functions return a promise, run them with the 'await' keyword.

To install packages: 'z.pkg.install("name", "version")'
To load a package: 'z.pkg.require("name", "version")'
To run a local script: 'z.pkg.execute("script.js")'
To upload a package: 'z.pkg.execute("name", "version", "index.js")'
`

export const ROOT_DIR = join(homedir(), '.z-node')
export const PKG_DIR = join(ROOT_DIR, 'pkg')
export const PKG_BIN_DIR = join(PKG_DIR, '.bin')
export const REPL_HISTORY_PATH = join(ROOT_DIR, 'repl-history')

export const Z_EMPIRE_META_KEY = 'e4dfa4869929ac25b16da3c9aa9e7ce8db66a522a9ebf34478d33ea15ab18984'

const checkDirs = (...dirs: string[]) => dirs.forEach(dir => {
  !existsSync(dir) && mkdirSync(dir)
})

checkDirs(ROOT_DIR, PKG_DIR, PKG_BIN_DIR)
