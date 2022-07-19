import { pipe } from 'fp-ts/function'
import * as T from 'fp-ts/Task'

declare const print: (s: string) => T.Task<void>
declare const readLine: T.Task<string>

const main: T.Task<{ x: string, y: string }> = pipe(
    readLine,
    T.map(x => ({ x })),
    T.chain(({ x }) => pipe(readLine, T.map(y => ({ x, y })))),
    T.chainFirst(({ x }) => print(x)),
    T.chainFirst(({ y }) => print(y)),
)

const mainDo: T.Task<{ x: string, y: string }> = pipe(
    T.Do,
    T.bind('x', () => readLine),
    T.bind('y', () => readLine),
    T.chainFirst(({ x }) => print(x)),
    T.chainFirst(({ y }) => print(y)),
)

const mainDo2: T.Task<{ line: string, y: string }> = pipe(
    T.Do,
    T.bind('line', () => readLine),
    T.bind('y', () => readLine),
    T.chain(src => { print(src.line); return T.of(src) }),
    T.chainFirst(({ y }) => print(y)),
)
