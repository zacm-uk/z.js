import { join, resolve, basename } from 'path'
import { existsSync, readFile, remove, writeFile } from 'fs-extra'

import { getPackage, uploadPackage, getLatestVersion } from '../pkg-server'
import { createNewGlobalContext } from '../z-mods/global'
import { uploadProject } from '../project-uploader'

export type PackageContextOpts = {
  packageDir: string
  packageBinDir: string
}

export class PackageContext {
  public readonly packageDir: string
  public readonly packageBinDir: string
  public autoInstallMissing: boolean = true

  constructor({ packageDir, packageBinDir }: PackageContextOpts) {
    if (!existsSync(packageDir)) {
      throw new Error(`Package directory does not exist: ${ packageDir }`)
    }
    if (!existsSync(packageBinDir)) {
      throw new Error(`Package bin directory does not exist: ${ packageBinDir }`)
    }

    this.packageDir = packageDir
    this.packageBinDir = packageBinDir
  }

  async remove(name: string, version: string) {
    await remove(join(this.packageDir, `${ name }~${ version }`))
  }

  async install(name: string, version: string) {
    const pkg = await getPackage(name, version)
    const jsPath = join(this.packageDir, `${ name }~${ version }`)
    await writeFile(jsPath, pkg)
  }

  runScript(script: string) {
    return PackageContext._runScript(script, createNewGlobalContext('script', '1.0.0'))
  }

  async execute(file: string) {
    const path = resolve(process.cwd(), file)
    const script = await readFile(path, 'utf-8')
    return PackageContext._runScript(script, createNewGlobalContext(basename(file), '1.0.0'))
  }

  async require(name: string, version: string) {
    if (version === 'latest') {
      version = await getLatestVersion(name)
    }
    const path = join(this.packageDir, `${ name }~${ version }`)
    if (!existsSync(path)) {
      if (!this.autoInstallMissing) {
        throw new Error(`Package "${ name }@${ version }" is not installed and "autoInstallMissing" is not enabled`)
      }
      await this.install(name, version)
    }
    const script = await readFile(path, 'utf8')
    return PackageContext._runScript(script, createNewGlobalContext(name, version))
  }

  async uploadPackage(name: string, version: string, file: string) {
    const buffer = await readFile(resolve(process.cwd(), file))
    await uploadPackage(name, version, buffer)
  }

  async uploadProject(name: string, version: string, dir: string) {
    await uploadProject(name, version, dir)
  }

  private static async _runScript(script: string, _z: Z) {
    // @ts-ignore
    const module = { exports: {} }
    const fn: () => Promise<any> = eval(`(async () => {
      ${ script }
    })`)
    const result: any = (await fn()) || {}
    if (!result) {
      return module.exports
    }
    if (result instanceof Object) {
      Object.entries(module.exports).forEach(([key, value]) => result[key] = value)
    }
    return result
  }
}
