import './empireEnv'
import { node } from 'z-empire'
import { Z_EMPIRE_META_KEY } from '../settings'

type Meta = {
  keyMap: { [key: string]: string }
}

const getMeta = () => node.getData(Z_EMPIRE_META_KEY).then(({ value }) => (value ? JSON.parse(value) : { keyMap: {} }) as Meta)

const setMeta = (meta: Meta) => node.updateData(Z_EMPIRE_META_KEY, JSON.stringify(meta))

export const getPackage = async (name: string, version: string) => {
  const { keyMap } = await getMeta()
  const storageKey = keyMap[`${ name }~${ version }`]
  const { value } = await node.getData(storageKey)
  return value ? Buffer.from(value, 'hex') : null
}

export const uploadPackage = async (name: string, version: string, buffer: Buffer) => {
  const data = buffer.toString('hex')
  const { storageKey } = await node.setData(`${ name }~${ version }`, data)
  const meta = await getMeta()
  meta.keyMap[`${ name }~${ version }`] = storageKey
  await setMeta(meta)
}
