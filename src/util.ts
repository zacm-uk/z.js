import WritableStream = NodeJS.WritableStream
import ReadableStream = NodeJS.ReadableStream

import { spawn } from 'child_process'
import { tmpdir } from 'os'
import { randomBytes } from 'crypto'
import { join } from 'path'

import { remove, mkdirSync } from 'fs-extra'

export type ExecOpts = {
  command: string
  args: string[]
  cwd: string
  stderr: WritableStream | boolean
  stdout: WritableStream | boolean
  stdin?: ReadableStream
}

export type ExecLogItem = {
  type: 'stdout' | 'stderr'
  contents: string
}

export type ExecOut = {
  log: ExecLogItem[]
  exitCode: number
}

export const exec = (opts: ExecOpts) => {
  const child = spawn(opts.command, opts.args, { cwd: opts.cwd })

  const log: ExecLogItem[] = []

  child.stderr.on('data', chunk => {
    const contents = chunk.toString()
    log.push({
      type: 'stderr',
      contents
    })
  })

  child.stdout.on('data', chunk => {
    const contents = chunk.toString()
    log.push({
      type: 'stdout',
      contents
    })
  })

  if (typeof (opts.stderr as WritableStream).write === 'function') {
    child.stderr.pipe(opts.stderr as WritableStream)
  } else if (opts.stderr === true) {
    child.stderr.pipe(process.stderr)
  }
  if (typeof (opts.stdout as WritableStream).write === 'function') {
    child.stdout.pipe(opts.stdout as WritableStream)
  } else if (opts.stdout === true) {
    child.stdout.pipe(process.stdout)
  }
  if (opts.stdin) {
    opts.stdin.pipe(child.stdin)
  }

  return new Promise<ExecOut>((resolve, reject) => {
    child.on('error', reject)
    child.on('exit', code => {
      resolve({
        log,
        exitCode: code as number
      })
    })
  })
}

export class TempDir {
  private _path: string = join(tmpdir(), randomBytes(12).toString('hex'))
  private _open: boolean = false

  get path() {
    if (!this._open) {
      mkdirSync(this._path)
      this._open = true
    }
    return this._path
  }

  async cleanup() {
    if (!this._open) {
      return
    }
    await remove(this._path)
    this._open = false
  }
}
