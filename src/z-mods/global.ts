// import Module from 'module'

import { PackageContext } from '../pkg'
import { PKG_BIN_DIR, PKG_DIR } from '../settings'

declare global {
  interface Z {
    pkg: PackageContext
  }

  const z: Z
}

export const createNewGlobalContext = () => ({
    pkg: new PackageContext({ packageDir: PKG_DIR, packageBinDir: PKG_BIN_DIR })
  })

;(global as any).z = createNewGlobalContext()

// const oldLoad = (Module as any)._load
// ;(Module as any)._load = function (packageName: string) {
//   const mainPath = z.pkg.getMainPathSync(packageName)
//   if (mainPath) {
//     return oldLoad.apply(this, [ mainPath.path, arguments[1], arguments[2] ])
//   }
//   return oldLoad.apply(this, arguments as any)
// }
