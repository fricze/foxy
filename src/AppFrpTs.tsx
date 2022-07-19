import React, { useEffect, useRef } from 'react';
import { Suspense } from 'react'
import { a, useSpring } from '@react-spring/web'
import Parser from 'html-react-parser'
import { Provider, atom, useAtom, useSetAtom } from 'jotai'
import { atom as fAtom } from '@frp-ts/core'
import { useProperty } from '@frp-ts/react'
import { Slide, slides } from './data';
import { pipe } from 'fp-ts/function'
import { set } from 'spectacles-ts'
import { run } from './rxfuckery'
import * as T from 'fp-ts/Task'



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

const setSelected = (state: Slide[], idx: number) =>
  pipe(state,
    set('[]>.selected', false),
    set('[number].selected', idx, true)
  );

const setText = (state: Slide[], idx: number, text: string) =>
  pipe(state,
    set('[number].content.[number]', idx, 0, text)
  );

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

const BigSlide = (
  { selected, title, content, setText }: Slide & { setText?: (text: string) => void }
) => {
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
      value={content[0]} onChange={e => setText && setText(e.target.value)} />
  </div>
}


// We create an atom that will allow us to get values,
// update its value manually and listen to updates.
const counter = fAtom.newAtom(0)

const slidesAtom = fAtom.newAtom(slides)
slidesAtom.modify(v => v)

export default function App() {
  const slidesValue = useProperty(slidesAtom)

  const counterValue = useProperty(counter)

  return (
    <Provider>
      <div style={{ display: 'flex', flexDirection: 'row', }}>
        <h1
          style={{ userSelect: 'none' }}
          onClick={() => counter.modify(n => n + 1)}>
          number value {counterValue}
        </h1>
        <div style={containerStyle}>
          {slidesValue.map(({ title, content, selected }, idx) => <div
            key={idx}
            onClick={() => slidesAtom.modify(v => setSelected(v, idx))}
            style={selected ? {
              ...slideStyle,
              outline: 'rgb(111 189 214) solid 4px'
            } : slideStyle}>
            <h2>{title}</h2>
            <p>{content}</p>
          </div>)}
        </div>

        <div style={mainContainerStyle}>
          {slidesValue.map(({ title, content, selected }, idx) =>
            <BigSlide
              key={idx}
              title={title}
              selected={selected}
              content={content}
              setText={(text: string) => slidesAtom.modify(v => setText(v, idx, text))}
            />)}
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
