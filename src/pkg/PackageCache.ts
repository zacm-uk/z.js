import { join } from 'path'
import { existsSync, mkdir, copy } from 'fs-extra'

import tar from 'tar'

import { exec, TempDir } from '../util'

import { CACHE_DIR } from '../settings'

class PackageCache {
  private _dir: string

  constructor(dir: string) {
    this._dir = dir
  }

  private get _downloadDir() {
    return join(this._dir, 'downloads')
  }

  async _initDirs() {
    if (!existsSync(this._dir)) {
      await mkdir(this._dir)
    }
    if (!existsSync(this._downloadDir)) {
      await mkdir(this._downloadDir)
    }
  }

  async install(name: string, version?: string) {
    await this._initDirs()
    const versionStr = version ? `@${ version }` : ''
    const { log, exitCode } = await exec({
      command: 'npm',
      args: [ 'pack', `${ name }${ versionStr }` ],
      cwd: this._downloadDir,
      stdout: true,
      stderr: true
    })
    if (exitCode !== 0) {
      throw new Error('Download failed')
    }
    const fileName = log[log.length - 1].contents.trim()
    const [ , v ] = fileName.replace('.tgz', '').split('-')
    const tarFile = join(this._downloadDir, fileName)
    const tempDir = new TempDir()
    await tar.x({ file: tarFile, C: tempDir.path })
    const extracted = join(tempDir.path, 'package')
    const moveTo = join(this._dir, `${ name }-${ v }`)
    await copy(extracted, moveTo)
    tempDir.cleanup()
    return { path: moveTo, name, version: v }
  }
}

export const packageCache = new PackageCache(join(CACHE_DIR, 'pkg'))
