import {
  engine,
  Entity,
  Transform,
  MeshRenderer,
  TextShape,
  pointerEventsSystem,
  InputAction
} from '@dcl/sdk/ecs'
import { Vector3 } from '@dcl/sdk/math'

const REQUIRED_PET_COUNT = 5

// 状態
let pettedSheepCount = 0
let isUnlocked = false
let isStarted = false

// 撫でた羊を記録（同じ羊を2回カウントしないため）
const pettedSheepSet = new Set<Entity>()

// ==========================
// 初期化（ボタンを作る）
// ==========================
export function setupSheepMarchReward(startSheepMarch: () => void) {
  const button = engine.addEntity()

  Transform.create(button, {
    position: Vector3.create(8, 0.4, 8),
    scale: Vector3.create(1.8, 0.4, 1.8)
  })

  MeshRenderer.setBox(button)

  const label = engine.addEntity()

  Transform.create(label, {
    parent: button,
    position: Vector3.create(0, 1.2, 0),
    scale: Vector3.create(0.7, 0.7, 0.7)
  })

  TextShape.create(label, {
    text: `羊を${REQUIRED_PET_COUNT}匹なでると押せる`,
    fontSize: 3
  })

  // ボタン押下
  pointerEventsSystem.onPointerDown(
    {
      entity: button,
      opts: {
        button: InputAction.IA_PRIMARY,
        hoverText: '羊大行進'
      }
    },
    () => {
      // まだ解放されていない
      if (!isUnlocked) {
        console.log(`まだ押せません (${pettedSheepCount}/${REQUIRED_PET_COUNT})`)
        return
      }

      // すでに開始済み
      if (isStarted) {
        console.log('すでに開始済み')
        return
      }

      isStarted = true

      TextShape.getMutable(label).text = '羊大行進スタート！'
      console.log('羊大行進スタート！')

      startSheepMarch()
    }
  )
}

// ==========================
// 羊を撫でたとき
// ==========================
export function registerSheepAsPetted(sheep: Entity) {
  // すでに撫でた羊はカウントしない
  if (pettedSheepSet.has(sheep)) {
    return
  }

  pettedSheepSet.add(sheep)
  pettedSheepCount++

  console.log(`撫でた羊: ${pettedSheepCount}`)

  // ★ここが今回のポイント（5以上で解放）
  if (pettedSheepCount >= REQUIRED_PET_COUNT && !isUnlocked) {
    isUnlocked = true

    console.log('羊大行進ボタンが押せるようになりました！')
  }
}

export function canStartSheepMarch() {
  return isUnlocked
}

// ==========================
// カウントを0に戻す ボタン解放をOFFにする 撫でた羊リストを空にする
// ==========================

export function consumeSheepMarchReward() {
  pettedSheepCount = 0
  isUnlocked = false
  pettedSheepSet.clear()

  console.log('なでなでポイントを消費しました（リセット）')
}