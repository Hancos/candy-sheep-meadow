import {
  engine,
  GltfContainer,
  Transform,
  Animator,
  PointerEvents,
  PointerEventType,
  inputSystem,
  InputAction,
  Entity
} from '@dcl/sdk/ecs'
import { Vector3, Quaternion  } from '@dcl/sdk/math'
import { canStartSheepMarch } from '../sheepMarchReward'
import { consumeSheepMarchReward } from '../sheepMarchReward'
import { MessageBus } from '@dcl/sdk/message-bus'

// ===== 範囲 =====
const MIN_X = 8
const MAX_X = 22
const MIN_Z = 8
const MAX_Z = 22

// ===== 羊の出口 =====
const EXIT_POSITION = Vector3.create(8, 1, 16.2)

// ===== 空中散歩設定 =====
const RUSH_SPEED_X = 3
const RUSH_SPEED_Y = 4

// ===== ボーナスタイム設定 =====
const RUSH_DURATION = 30
const RUSH_COOLDOWN = 40
const RUSH_SPAWN_INTERVAL = 0.8

let rushActive = false
let rushTimer = 0
let rushCooldown = 0
let spawnTimer = 0

let rushButton: Entity | null = null

type RushSheepData = {
  entity: Entity
  speedX: number
  speedY: number
  speedZ: number
  driftTime: number
  driftSpeed: number
  driftAmount: number
  rotationSpeed: number
  rotationOffsetX: number
rotationOffsetY: number
rotationOffsetZ: number
}

const rushSheepEntities: RushSheepData[] = []

const bus = new MessageBus() //メッセージバス

bus.on('startRushHour', () => {
  startRushHour()
}) //メッセージバスここまで

function startRushHour() {
  if (rushActive) return

  rushActive = true
  rushTimer = RUSH_DURATION
  spawnTimer = 0
  rushCooldown = RUSH_COOLDOWN
}

function createRushSheep() {
  const sheep = engine.addEntity()

  Transform.create(sheep, {
   position: Vector3.create(
    EXIT_POSITION.x,
    EXIT_POSITION.y,
    EXIT_POSITION.z + Math.random() * 0.8 - 0.4
    ),
   rotation: Quaternion.fromEulerDegrees(0, 90, 0)
  })

  GltfContainer.create(sheep, {
    src:
      Math.random() > 0.5
        ? 'assets/scene/Models/pink_sheep.glb'
        : 'assets/scene/Models/greensheep.glb'
  })

  Animator.create(sheep, {
    states: [
      {
        clip: 'Walking',
        playing: true,
        loop: true
      }
    ]
  })

  rushSheepEntities.push({
   entity: sheep,
   speedX: 0.4 + Math.random() * 0.5,
   speedY: 0.2 + Math.random() * 0.2, //上方向のスピード
   speedZ: Math.random() * 2 - 1,
   driftTime: Math.random() * 10,
   driftSpeed: 1 + Math.random() * 1.5,
   driftAmount: 0.2 + Math.random() * 0.3,
   rotationSpeed: 1 + Math.random() * 2,
   rotationOffsetX: Math.random() * 30 - 30,
    rotationOffsetY: Math.random() * 0 - 30,
    rotationOffsetZ: Math.random() * 30 - 30
  })
}

export function setupRushButton() {
  rushButton = engine.addEntity()

  Transform.create(rushButton, {
    position: Vector3.create(3.85, 7.3, 23.3),
    scale: Vector3.create(1, 1, 1)
  })

  GltfContainer.create(rushButton, {
    src: 'assets/scene/Models/rushbutton.glb'
  })

  PointerEvents.create(rushButton, {
    pointerEvents: [
      {
        eventType: PointerEventType.PET_DOWN,
        eventInfo: {
          hoverText: 'Rush Sheep!'
        }
      }
    ]
  })
}

function rushButtonSystem(dt: number) {
  if (rushCooldown > 0) {
    rushCooldown -= dt
  }

  if (!rushButton) return

  if (
    inputSystem.isTriggered(
      InputAction.IA_POINTER,
      PointerEventType.PET_DOWN,
      rushButton
    )
  ) {

    if (!canStartSheepMarch()) {
     console.log('まだ羊を5匹撫でていません')
     return
    }

    if (!rushActive && rushCooldown <= 0) {
     bus.emit('startRushHour', {})

      startRushHour()

     consumeSheepMarchReward()
    }
  }
}

function rushHourSystem(dt: number) {
  if (rushActive) {
    rushTimer -= dt
    spawnTimer -= dt

    if (spawnTimer <= 0) {
      spawnTimer = RUSH_SPAWN_INTERVAL
      createRushSheep()
    }

    if (rushTimer <= 0) {
      rushActive = false
    }
  }

  // ラッシュ羊だけ動かす
  for (let i = rushSheepEntities.length - 1; i >= 0; i--) {
    const sheepData = rushSheepEntities[i]
    const entity = sheepData.entity

    if (!Transform.has(entity)) {
      rushSheepEntities.splice(i, 1)
      continue
    }

    const transform = Transform.getMutable(entity)

     sheepData.driftTime += dt

     transform.position.x += sheepData.speedX * dt
     transform.position.y += sheepData.speedY * dt
     transform.position.z += sheepData.speedZ * dt

     transform.position.z +=
     Math.sin(sheepData.driftTime * sheepData.driftSpeed) *
     sheepData.driftAmount *
     dt

     transform.rotation = Quaternion.fromEulerDegrees(
  sheepData.rotationOffsetX + Math.sin(sheepData.driftTime * 0.7) * 8,
  90 + sheepData.rotationOffsetY + sheepData.driftTime * sheepData.rotationSpeed,
  sheepData.rotationOffsetZ + Math.cos(sheepData.driftTime * 0.5) * 8
)

    if (transform.position.x > MAX_X || transform.position.y > 12) {
     engine.removeEntity(entity)
     rushSheepEntities.splice(i, 1)
    }
  }
}

engine.addSystem(rushButtonSystem)
engine.addSystem(rushHourSystem)