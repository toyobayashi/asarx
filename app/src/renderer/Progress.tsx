import './progress.css'
import * as React from 'react'

interface Props {
  infinity?: boolean
  max?: number
  min?: number
  pos?: number
}

export default function Progress (props: Props) {
  const max = props.max || 100
  const min = props.min || 0
  const pos = props.pos || 0
  const infinity = props.infinity || false

  const computedMax = max <= min ? 100 : max
  const computedMin = max <= min ? 0 : min
  let computedPos = 0
  if (pos < computedMin) {
    computedPos = computedMin
  } else if (pos > computedMax) {
    computedPos = computedMax
  } else {
    computedPos = pos
  }

  const percent = (computedPos - computedMin) / (computedMax - computedMin) * 100
  return (
    <div className='progress' style={{ backgroundColor: infinity ? '#e6e6e6' : '#06b025' }}>
      {infinity ? void 0 : <div className='slide'></div>}
      {infinity ? void 0 : <div className='progress-rest' style={{ width: 100 - percent + '%' }}></div>}
      {infinity ? <div className='progress-infinity'></div> : void 0}
    </div>
  )
}
