import './empireEnv'
import { node } from 'z-empire'
import { Z_EMPIRE_META_KEY } from '../settings'

type Meta = {
  keyMap: { [key: string]: string }
}

const getMeta = () => node.getData(Z_EMPIRE_META_KEY).then(({ value }) => (value ? JSON.parse(value) : { keyMap: {} }) as Meta)

const setMeta = (meta: Meta, awaitReplicate: boolean) => node.updateData(Z_EMPIRE_META_KEY, JSON.stringify(meta), awaitReplicate)

export const getLatestVersion = async (name: string) => {
  const { keyMap } = await getMeta()
  return Object.keys(keyMap)
    .map(key => key.split('~'))
    .filter(([ key ]) => key === name)
    .map(([ _name, version ]) => version)
    .reduce((acc, version) => {
      const toSemVer = (str: string) => {
        const [ majorStr, minorStr, patchStr ] = str.split('.')
        return { major: Number(majorStr), minor: Number(minorStr), patch: Number(patchStr) }
      }
      const existing = toSemVer(acc)
      const v = toSemVer(version)
      const majorGt = existing.major > v.major
      const majorEq = existing.major === v.major
      const minorGt = existing.minor > v.minor
      const minorEq = existing.minor === v.minor
      const patchGt = existing.patch > v.patch
      return (majorGt || (majorEq && minorGt) || (majorEq && minorEq && patchGt)) ? acc : version
    }, '0.0.0')
}

export const getPackage = async (name: string, version: string) => {
  const { keyMap } = await getMeta()
  const storageKey = keyMap[`${ name }~${ version }`]
  const { value } = await node.getData(storageKey)
  return value ? Buffer.from(value, 'hex') : null
}

export const uploadPackage = async (name: string, version: string, buffer: Buffer) => {
  const data = buffer.toString('hex')
  const { storageKey } = await node.setData(`${ name }~${ version }`, data, false)
  const meta = await getMeta()
  meta.keyMap[`${ name }~${ version }`] = storageKey
  await setMeta(meta, false)
  await node.updateNodes()
}
