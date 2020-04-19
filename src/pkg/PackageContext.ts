import { join, resolve } from 'path'
import { existsSync, readFile, remove, writeFile } from 'fs-extra'

import { getPackage, uploadPackage } from '../pkg-server'
import { createNewGlobalContext } from '../z-mods/global'

export type PackageContextOpts = {
  packageDir: string
  packageBinDir: string
}

export class PackageContext {
  public readonly packageDir: string
  public readonly packageBinDir: string
  public autoInstallMissing: boolean = false

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

  async execute(file: string) {
    const path = resolve(process.cwd(), file)
    const script = await readFile(path, 'utf-8')
    return PackageContext._runScript(script)
  }

  async require(name: string, version: string) {
    const path = join(this.packageDir, `${ name }~${ version }`)
    if (!existsSync(path)) {
      if (!this.autoInstallMissing) {
        throw new Error(`Package "${ name }@${ version }" is not installed and "autoInstallMissing" is not enabled`)
      }
      await this.install(name, version)
    }
    const script = await readFile(path, 'utf8')
    return PackageContext._runScript(script)
  }

  async uploadPackage(name: string, version: string, file: string) {
    const buffer = await readFile(resolve(process.cwd(), file))
    await uploadPackage(name, version, buffer)
  }

  private static async _runScript(script: string) {
    const z = createNewGlobalContext()
    z.pkg.autoInstallMissing = true
    const fn: () => Promise<any> = eval(`(async () => {
      ${ script }
    })`)
    return fn()
  }
}
