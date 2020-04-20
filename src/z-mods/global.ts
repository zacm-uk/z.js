import { PackageContext } from '../pkg'
import { NAME, PKG_BIN_DIR, PKG_DIR, VERSION } from '../settings'

declare global {
  interface Z {
    pkg: PackageContext
    meta: {
      packageName: string
      packageVersion: string
    }
  }

  const z: Z
}

export const createNewGlobalContext = (packageName: string, packageVersion: string) => ({
    pkg: new PackageContext({ packageDir: PKG_DIR, packageBinDir: PKG_BIN_DIR }),
    meta: {
      packageName,
      packageVersion
    }
  })

;(global as any).z = createNewGlobalContext(NAME, VERSION)
