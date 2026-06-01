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

// ===== ボーナスタイム設定 =====
const RUSH_DURATION = 30
const RUSH_COOLDOWN = 40
const RUSH_SPAWN_INTERVAL = 0.2
const RUSH_SPEED = 5

let rushActive = false
let rushTimer = 0
let rushCooldown = 0
let spawnTimer = 0

let rushButton: Entity | null = null
const rushSheepEntities: Entity[] = []

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
     MIN_X,
     0,
     MIN_Z + Math.random() * (MAX_Z - MIN_Z)
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

  rushSheepEntities.push(sheep)
}

export function setupRushButton() {
  rushButton = engine.addEntity()

  Transform.create(rushButton, {
    position: Vector3.create(16, 0.2, 16),
    scale: Vector3.create(1, 0.3, 1)
  })

  GltfContainer.create(rushButton, {
    src: 'assets/scene/Models/button.glb'
  })

  PointerEvents.create(rushButton, {
    pointerEvents: [
      {
        eventType: PointerEventType.PET_DOWN,
        eventInfo: {
          hoverText: 'ボーナスタイム！'
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
    const entity = rushSheepEntities[i]

    if (!Transform.has(entity)) {
      rushSheepEntities.splice(i, 1)
      continue
    }

    const transform = Transform.getMutable(entity)
    transform.position.x += RUSH_SPEED * dt

    if (transform.position.x > MAX_X) {
      engine.removeEntity(entity)
      rushSheepEntities.splice(i, 1)
    }
  }
}

engine.addSystem(rushButtonSystem)
engine.addSystem(rushHourSystem)