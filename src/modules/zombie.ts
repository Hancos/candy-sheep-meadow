import { Vector3, Quaternion } from '@dcl/sdk/math'
import {
  engine,
  GltfContainer,
  Transform,
  Animator,
  inputSystem,
  InputAction,
  PointerEventType,
  PointerEvents,
  VisibilityComponent,
  AudioSource
} from '@dcl/sdk/ecs'
import { Zombie } from '../definitions'
import { isInScene } from './onlyRenderInScene'
import { registerSheepAsPetted } from '../sheepMarchReward'
import * as utils from '@dcl-sdk/utils'

const ROTATION_SPEED = 1
const SHEEP_FOLLOW_OFFSETS = [
  Vector3.create(1.5, 0, 0),
  Vector3.create(-1.5, 0, 0),
  Vector3.create(0, 0, 1.5),
  Vector3.create(0, 0, -1.5),

  Vector3.create(2.5, 0, 1.5),
  Vector3.create(-2.5, 0, 1.5),
  Vector3.create(2.5, 0, -1.5),
  Vector3.create(-2.5, 0, -1.5),

  Vector3.create(3.5, 0, 0),
  Vector3.create(-3.5, 0, 0)
]

let isFeedingTime = false
let canStartFeeding = false
let feedUnlockTimer = 60
let feedingTimeLeft = 0

export function createZombie(
  position: Vector3,
  modelPath: string,
  movementSpeed: number,
  attackDistance: number,
  sheepIndex: number
) {
  const zombieEntity = engine.addEntity()

  Transform.create(zombieEntity, {
    position
  })

  GltfContainer.create(zombieEntity, {
    src: modelPath
  })

  Animator.create(zombieEntity, {
    states: [
      {
        clip: 'Walking',
        playing: true,
        loop: true
      }
    ]
  })

  const damageEntity = engine.addEntity()
  const heartEntity = engine.addEntity()

  Zombie.create(zombieEntity, {
    movementSpeed,
    rotationSpeed: ROTATION_SPEED,
    attackDistance,
    sheepIndex,
    damageEntity,
    heartEntity,

    floatTimer: 0,
    shakeTimer: 0,
    baseY: position.y
  })

  // Pet用：キラキラ
  Transform.create(damageEntity, {
    parent: zombieEntity,
    position: Vector3.create(0, 0.1, 0)
  })

  GltfContainer.create(damageEntity, {
    src: 'assets/scene/Models/sparkling.glb'
  })

  VisibilityComponent.create(damageEntity, {
    visible: false
  })

  // Feed用：ハート
  Transform.create(heartEntity, {
    parent: zombieEntity,
    position: Vector3.create(0, 0.1, 0)
  })

  GltfContainer.create(heartEntity, {
    src: 'assets/scene/Models/hearteffect.glb'
  })

  VisibilityComponent.create(heartEntity, {
    visible: false
  })

  AudioSource.create(zombieEntity, {
  audioClipUrl: 'assets/scene/sounds/pet1.wav',
  playing: false,
  loop: false
  })

  PointerEvents.create(zombieEntity, {
    pointerEvents: [
      {
        eventType: PointerEventType.PET_DOWN,
        eventInfo: {
          hoverText: 'Pet'
        }
      }
    ]
  })
}

function zombieMovementSystem(deltaTime: number) {
  if (!Transform.has(engine.PlayerEntity)) return

  const playerPos = Transform.get(engine.PlayerEntity).position

  if (!isInScene(playerPos)) return

  for (const [entity] of engine.getEntitiesWith(Zombie)) {
    const transform = Transform.getMutable(entity)

    const zombie = Zombie.getMutable(entity)
    const offset = SHEEP_FOLLOW_OFFSETS[zombie.sheepIndex % SHEEP_FOLLOW_OFFSETS.length]

    const targetPos = Vector3.add(playerPos, offset)

    const lookAtTarget = Vector3.create(
      playerPos.x,
      transform.position.y,
      playerPos.z
    )
    const lookAtDirection = Vector3.subtract(lookAtTarget, transform.position)
      transform.rotation = Quaternion.slerp(
      transform.rotation,
      Quaternion.lookRotation(lookAtDirection),
      ROTATION_SPEED + deltaTime
    )



    const distance = Vector3.distanceSquared(transform.position, targetPos)
    const isInAttackDistance = distance < zombie.attackDistance * zombie.attackDistance

    if (!isInAttackDistance) {
      const moveDirection = Vector3.normalize(
        Vector3.subtract(targetPos, transform.position)
      )

      const positionDelta = Vector3.scale(
        moveDirection,
        zombie.movementSpeed * deltaTime
      )

      transform.position = Vector3.add(transform.position, positionDelta)

      transform.position.x = Math.max(8, Math.min(22, transform.position.x))
      transform.position.z = Math.max(8, Math.min(22, transform.position.z))
    }
  }
}

function playSheepSound(position: Vector3, soundPath: string) {
  const soundEntity = engine.addEntity()

  Transform.create(soundEntity, {
    position
  })

  AudioSource.create(soundEntity, {
    audioClipUrl: soundPath,
    playing: true,
    loop: false
  })

  utils.timers.setTimeout(() => {
    engine.removeEntity(soundEntity)
  }, 3000)
}

function zombieLifeSystem(dt: number) {
  // 餌やり60秒待ち
  if (!canStartFeeding && !isFeedingTime) {
    feedUnlockTimer -= dt

    if (feedUnlockTimer <= 0) {
      canStartFeeding = true
      feedUnlockTimer = 0
      VisibilityComponent.getMutable(feedButton).visible = true
    }
  }

  // feedボタン
  if (inputSystem.isTriggered(InputAction.IA_POINTER, PointerEventType.PET_DOWN, feedButton)) {
    if (canStartFeeding) {
      isFeedingTime = true
      canStartFeeding = false
      feedingTimeLeft = 30
      VisibilityComponent.getMutable(feedButton).visible = false
    }
  }

  // 餌やり30秒タイマー
  if (isFeedingTime) {
    feedingTimeLeft -= dt

    if (feedingTimeLeft <= 0) {
      isFeedingTime = false
      feedingTimeLeft = 0
      feedUnlockTimer = 60
    }
  }

  for (const [entity] of engine.getEntitiesWith(Zombie)) {
    const zombie = Zombie.getMutable(entity)
    const transform = Transform.getMutable(entity)

    // Feed時だけ文字切り替え
    PointerEvents.getMutable(entity).pointerEvents[0].eventInfo!.hoverText =
      isFeedingTime ? 'Feed' : 'Pet'

    // 震える
    if (zombie.shakeTimer > 0) {
      zombie.shakeTimer -= dt

      const shake = Math.sin(zombie.shakeTimer * 30) * 0.01
      transform.position.x += shake

      if (zombie.shakeTimer <= 0) {
        zombie.floatTimer = 5
      }
    }

    // 浮く
    if (zombie.floatTimer > 0) {
      zombie.floatTimer -= dt

      const progress = 1 - zombie.floatTimer / 5
      const height = Math.sin(progress * Math.PI) * 0.8

      transform.position.y = zombie.baseY + height
    } else {
      transform.position.y = zombie.baseY
    }

    

    // 羊を押した時
    if (inputSystem.isTriggered(InputAction.IA_POINTER, PointerEventType.PET_DOWN, entity)) {
      if (isFeedingTime) {
        // Feed：ハート + 震える + 浮く
        zombie.shakeTimer = 0.6
        zombie.floatTimer = 0

        zombie.damage = 1
        zombie.damageCooldown = 10
        VisibilityComponent.getMutable(zombie.heartEntity).visible = true

        playSheepSound(transform.position, 'assets/scene/sounds/feed1.wav')
      } else {
        // Pet：キラキラ + カウント
        // Pet：キラキラ + カウント
        zombie.damage = 1
        zombie.damageCooldown = 10
        VisibilityComponent.getMutable(zombie.damageEntity).visible = true

        playSheepSound(transform.position, 'assets/scene/sounds/pet1.wav')

        registerSheepAsPetted(entity)
      }
    }

    // エフェクトを消す
    if (zombie.damage > 0) {
      zombie.damageCooldown -= dt

      if (zombie.damageCooldown <= 0) {
        zombie.damage = 0
        zombie.damageCooldown = 0

        VisibilityComponent.getMutable(zombie.damageEntity).visible = false
        VisibilityComponent.getMutable(zombie.heartEntity).visible = false
      }
    }
  }
}

function createFeedButton() {
  const feedButton = engine.addEntity()

  VisibilityComponent.create(feedButton, {
    visible: false
  })

  Transform.create(feedButton, {
    position: Vector3.create(16, 1, 24)
  })

  GltfContainer.create(feedButton, {
    src: 'assets/scene/Models/feedbutton.glb'
  })

  PointerEvents.create(feedButton, {
    pointerEvents: [
      {
        eventType: PointerEventType.PET_DOWN,
        eventInfo: {
          hoverText: 'Start Feeding'
        }
      }
    ]
  })

  return feedButton
}

const feedButton = createFeedButton()

engine.addSystem(zombieMovementSystem)
engine.addSystem(zombieLifeSystem)