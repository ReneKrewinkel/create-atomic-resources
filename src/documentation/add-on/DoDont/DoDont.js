import React from 'react'
import './DoDont.css'
import DontSvg from './dont.svg'
import DoSvg from './do.svg'

const DoDont = ({ doImage, doCaption = '', dontImage, dontCaption = ''}) => {

  const renderCaption = (cap) => {
    if(cap !== '') {
      return(
        <p className={'caption'}>{ cap }</p>
      )
    }
  }
  return(
    <div>
      <div className='subheading'>Do & Don't</div>
      <div className={'DoDont'}>

      <div className={'container'}>
        <div className={'box do'}>
          <img src={doImage} alt={'DO!'} />
          { renderCaption(doCaption)}

        </div>
        <div className={'notify'}>
          <img src={DoSvg} alt={'do'} />
        </div>
      </div>

      <div className={'container'}>
        <div className={'box dont'}>
          <img src={dontImage} alt={'DON\'T!'} />
          { renderCaption(dontCaption)}
        </div>
        <div className={'notify'}>
          <img src={DontSvg} alt={'dont'} />
        </div>
      </div>

    </div>
    </div>
  )
}

export default DoDont