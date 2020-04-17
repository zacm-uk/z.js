import { join } from 'path'
import { homedir } from 'os'
import { mkdirSync, existsSync } from 'fs-extra'

export const ROOT_DIR = join(homedir(), '.z-node')
export const PKG_DIR = join(ROOT_DIR, 'pkg')
export const CACHE_DIR = join(ROOT_DIR, 'cache')

const checkDirs = (...dirs: string[]) => dirs.forEach(dir => {
  !existsSync(dir) && mkdirSync(dir)
})

checkDirs(ROOT_DIR, PKG_DIR, CACHE_DIR)
