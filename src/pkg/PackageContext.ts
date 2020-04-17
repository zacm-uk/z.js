import { join } from 'path'
import { existsSync, symlink, readdir, readFile } from 'fs-extra'

import { packageCache } from './PackageCache'
import { readdirSync, readFileSync } from 'fs'

export type PackageContextOpts = {
  packageDir: string
}

class Semver {
  public major: number
  public minor: number
  public patch: number

  constructor(str: string) {
    const [ major, minor, patch ] = str.split('.')
    this.major = Number(major)
    this.minor = Number(minor)
    this.patch = Number(patch)
  }

  isGreaterThan(ver: Semver) {
    if (this.major > ver.major) {
      return true
    }
    if (this.major < ver.major) {
      return false
    }
    if (this.minor > ver.minor) {
      return true
    }
    if (this.minor < ver.minor) {
      return false
    }
    return this.patch > ver.patch
  }

  isLessThan(ver: Semver) {
    return !this.isGreaterThan(ver)
  }

  isEqualTo(ver: Semver) {
    return this.major === ver.major && this.minor === ver.minor && this.patch === ver.patch
  }

  toString() {
    return `${ this.major }.${ this.minor }.${ this.patch }`
  }
}

export class PackageContext {
  public readonly packageDir: string

  private _cache = packageCache
  private _versionMap: Map<string, string> = new Map()

  constructor({ packageDir }: PackageContextOpts) {
    if (!existsSync(packageDir)) {
      throw new Error(`Package directory does not exist: ${ packageDir }`)
    }

    this.packageDir = packageDir
  }

  async install(name: string, version?: string) {
    if (version) {
      let temp = ''
      for (let i = 0; i < version.length; ++i) {
        const char = temp.charAt(i)
        if (Number.isInteger(Number(char)) || char === '.') {
          temp += char
        }
      }
    }
    const { path, version: v } = await this._cache.install(name, version)
    const newPath = join(this.packageDir, `${ name }-${ v }`)
    if (!existsSync(newPath)) {
      await symlink(path, newPath)
    }

    const json = join(path, 'package.json')
    const { dependencies = {} } = JSON.parse(readFileSync(json, 'utf8')) as { dependencies: any }
    for (const [ name, version ] of Object.entries(dependencies)) {
      await this.install(name, version as string)
    }
  }

  setDefaultVersion(name: string, version: string) {
    this._versionMap.set(name, version)
  }

  getDefaultVersion(name: string) {
    return this._versionMap.get(name)
  }

  private _getLatestFromList(name: string, packages: string[]) {
    const versions = []

    for (const pkg of packages) {
      const split = pkg.split('-')
      const version = split.pop()
      if (split.join('-') === name) {
        versions.push(version)
      }
    }
    return versions.sort((a?: string, b?: string) => {
      const semA = new Semver(a as string)
      const semB = new Semver(b as string)
      if (semA.isGreaterThan(semB)) {
        return -1
      }
      if (semA.isLessThan(semB)) {
        return 1
      }
      return 0
    })[0]
  }

  async getLatestVersion(name: string) {
    const packages = await readdir(this.packageDir)
    return this._getLatestFromList(name, packages)
  }

  getLatestVersionSync(name: string) {
    const packages = readdirSync(this.packageDir)
    return this._getLatestFromList(name, packages)
  }

  async getMainPath(name: string, version?: string) {
    const v = version || this._versionMap.get(name) || await this.getLatestVersion(name)
    if (!v) {
      return
    }
    const path = join(this.packageDir, `${ name }-${ v }`)
    const json = join(path, 'package.json')
    const { main } = JSON.parse(await readFile(json, 'utf8'))

    return { path: join(path, main) }
  }

  getMainPathSync(name: string, version?: string) {
    const v = version || this._versionMap.get(name) || this.getLatestVersionSync(name)
    if (!v) {
      return
    }
    const path = join(this.packageDir, `${ name }-${ v }`)
    const json = join(path, 'package.json')
    const { main } = JSON.parse(readFileSync(json, 'utf8'))

    return { path: join(path, main) }
  }
}
