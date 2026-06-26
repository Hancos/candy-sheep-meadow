import { getPettedSheepCount } from './sheepMarchReward'
import ReactEcs, { Label, ReactEcsRenderer, UiEntity, scaleFontSize } from '@dcl/sdk/react-ecs'
import { isMobile } from '@dcl/sdk/platform'
import { Color4 } from "@dcl/sdk/math"
// 時間経過をsheeptsから取り込む
import { getFeedStatus } from './modules/sheep'


const uiComponent = () => (
  [
    statusHUD()
  ]
)

function statusHUD() {
  const sheepCount = Math.min(getPettedSheepCount(), 5)
  const feedStatus = getFeedStatus()

  const isMobileDevice = isMobile()

  const hudFontSize = isMobileDevice ? 42 : 24
  const hudTop = isMobileDevice ? '3.2%' : '0.9%'
  const iconSize = isMobileDevice ? 44 : 32
  const hudPadding = isMobileDevice ? '14px 28px' : '8px 16px'
  const sheepLabelWidth = isMobileDevice ? 110 : 80
  const feedLabelWidth = isMobileDevice ? 170 : 140
  const hudWidth = isMobileDevice ? 420 : 320
const hudHeight = isMobileDevice ? 90 : 80
  

  // rushの色を変える
  let sheepColor = Color4.fromHexString("#141414")

  if (sheepCount >= 5) {
  sheepColor = Color4.fromHexString("#f8bb03")
  }

  // feedの色を変える
  let feedColor = Color4.Gray()

  if (feedStatus === 'Ready') {
    feedColor = Color4.fromHexString("#56e29e")
  }

  if (feedStatus === 'Active') {
   feedColor = Color4.fromHexString("#fd8cc2")
  }

  // HUDトップ全体
  return (
    <UiEntity
      uiTransform={{
        positionType: 'absolute',
        position: { top: hudTop, left: '0%', right: '0%' },
        alignItems: 'center',
        justifyContent: 'center',
      }}
     >
      <UiEntity
        uiTransform={{
  width: hudWidth,
  height: hudHeight,
  padding: hudPadding,
}}
        uiBackground={{
        textureMode: 'stretch',
        texture: {
         src: 'assets/scene/Images/hud_bg.png'
        }
        }}
     >

      <UiEntity //羊のアイコンとステータス
      uiTransform={{
       width: iconSize,
height: iconSize,
       margin: '5px 0px 0px 0px'
     }}
      uiBackground={{
       textureMode: 'stretch',
       texture: {
         src: 'assets/scene/Images/sheep_icon.png'
        }
     }}
      />

    <Label
     value={`${sheepCount}/5`}
     color={sheepColor}
     fontSize={scaleFontSize(hudFontSize)}
     textAlign="middle-center"
      uiTransform={{
        width: sheepLabelWidth
      }}
    />

   
    <UiEntity //feedのアイコンとステータス
      uiTransform={{
       width: iconSize,
       height: iconSize,
       margin: '5px 5px 0px 20px'
      }}
      uiBackground={{
       textureMode: 'stretch',
       texture: {
         src: 'assets/scene/Images/candy_icon.png'
       }
     }}
    />

    <Label
     value={feedStatus}
     color={feedColor}
     fontSize={scaleFontSize(hudFontSize)}
     textAlign="middle-left"
     uiTransform={{
     width: feedLabelWidth
     }}
    />

      </UiEntity>
    </UiEntity>
  )
}

export function setupUi() {
  ReactEcsRenderer.setUiRenderer(uiComponent, { virtualWidth: 1920, virtualHeight: 1080 })
}

