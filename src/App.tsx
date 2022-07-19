import React, { useEffect, useRef } from 'react';
import { Suspense } from 'react'
import { a, useSpring } from '@react-spring/web'
import Parser from 'html-react-parser'
import { Provider, atom, useAtom, useSetAtom } from 'jotai'
import { atom as fAtom } from '@frp-ts/core'
import { Slide, slides } from './data';
import { pipe } from 'fp-ts/function'
import { set } from 'spectacles-ts'
import { run } from './rxfuckery'
import * as T from 'fp-ts/Task'

declare const print: (s: string) => T.Task<void>
declare const readLine: T.Task<string>



// const main: T.Task<{ x: string, y: string }> = pipe(
//     readLine,
//     T.map(x => ({ x })),
//     T.chain(({ x }) => pipe(readLine, T.map(y => ({ x, y })))),
//     T.chainFirst(({ x }) => print(x)),
//     T.chainFirst(({ y }) => print(y)),
// )

// const mainDo: T.Task<{ x: string, y: string }> = pipe(
//     T.Do,
//     T.bind('x', () => readLine),
//     T.bind('y', () => readLine),
//     T.chainFirst(({ x }) => print(x)),
//     T.chainFirst(({ y }) => print(y)),
// )

// const mainDo2: T.Task<{ line: string, y: string }> = pipe(
//     T.Do,
//     T.bind('line', () => readLine),
//     T.bind('y', () => readLine),
//     T.chain(src => { print(src.line); return T.of(src) }),
//     T.chainFirst(({ y }) => print(y)),
// )

type PostData = {
    by: string
    descendants?: number
    id: number
    kids?: number[]
    parent: number
    score?: number
    text?: string
    time: number
    title?: string
    type: 'comment' | 'story'
    url?: string
}

const postId = atom(9001)
const postData = atom<Promise<PostData>>(async (get) => {
    const id = get(postId)
    const response = await fetch(
        `https://hacker-news.firebaseio.com/v0/item/${id}.json`
    )

    return await response.json()
})

function Id() {
    const [id] = useAtom(postId)
    const props = useSpring({ from: { id }, id, reset: true })
    return <a.h1>{props.id.to(Math.round)}</a.h1>
}

function Next() {
    // Use `useSetAtom` to avoid re-render
    // const [, set] = useAtom(postId)
    const setPostId = useSetAtom(postId)
    return (
        <button onClick={() => setPostId((id) => id + 1)}>
            <div>→</div>
        </button>
    )
}

function PostTitle() {
    const [{ by, text, time, title, url }] = useAtom(postData)

    return (
        <>
            <h2>{by}</h2>
            <h6>{new Date(time * 1000).toLocaleDateString('en-US')}</h6>
            {title && <h4>{title}</h4>}
            {url && <a href={url}>{url}</a>}
            {text && <div>{Parser(text)}</div>}
        </>
    )
}

const setSelected = (idx: number) => ((state: Slide[]) =>
    pipe(state,
        set('[]>.selected', false),
        set('[number].selected', idx, true)
    ));

const setText = (idx: number, text: string) => ((state: Slide[]) => pipe(state,
    set('[number].content.[number]', idx, 0, text)
));

const S = atom(slides)

const slideStyle = { height: 100, background: '#fff', borderRadius: 5 }

const containerStyle = {
    background: '#999',
    width: 200,
    height: '100vh',
    userSelect: 'none',
    marginLeft: 100,
    padding: 10,
    overflowY: 'scroll'
} as const;

const mainContainerStyle = {
    background: '#999',
    width: 500,
    height: '100vh',
    userSelect: 'none',
    marginLeft: 100,
    padding: 10,
    overflowY: 'scroll'
} as const;


const bigSlideStyle = { height: 400, background: '#fff', borderRadius: 5 } as const;

const BigSlide = ({ selected, title, content, setText }: Slide & { setText: (text: string) => void }) => {
    const ref = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (selected) {
            ref.current?.scrollIntoView({
                block: 'center'
            });
        }
    }, [selected])

    return <div
        ref={ref}
        style={bigSlideStyle}>
        <h2>{title}</h2>

        <textarea
            rows={4} cols={50} maxLength={5000}
            value={content[0]} onChange={e => setText(e.target.value)} />
    </div>
}


export default function App() {
    const slidesState = useAtom(S)

    const [s, setSlides] = slidesState;


    return (
        <Provider>
            <div style={{ display: 'flex', flexDirection: 'row', }}>
                <div style={containerStyle}>
                    {s.map(({ title, content, selected }, idx) => <div
                        key={idx}
                        onClick={() => setSlides(setSelected(idx))}
                        style={selected ? { ...slideStyle, outline: 'rgb(111 189 214) solid 4px' } : slideStyle}>
                        <h2>{title}</h2>
                        <p>{content}</p>
                    </div>)}
                </div>

                <div style={mainContainerStyle}>
                    {s.map(({ title, content, selected }, idx) =>
                        <BigSlide
                            key={idx}
                            title={title}
                            selected={selected}
                            content={content}
                            setText={text => setSlides(setText(idx, text))} />)}
                </div>
            </div>
        </Provider>
    )
}


{/* <Id />
      <div>
          <Suspense fallback={<h2>Loading...</h2>}>
                  <PostTitle />
              </Suspense>
          </div> */}

{/* <Next /> */ }


// We create an atom that will allow us to get values, update its value manually and listen to updates.
const counter = fAtom.newAtom(0)

// get the last value
console.log(counter.get()) // logs '0'

// let's manually set the value
counter.set(1)

// get the last value
console.log(counter.get()) // logs '1'

// or we can modify instead of setting
counter.modify((n) => n + 1)

// get the last value
console.log(counter.get()) // logs '2'
