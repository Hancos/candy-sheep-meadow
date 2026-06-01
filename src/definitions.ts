import { engine, Schemas } from '@dcl/sdk/ecs'

export const Zombie = engine.defineComponent(
  'Zombie',
  {
    movementSpeed: Schemas.Number,
    rotationSpeed: Schemas.Number,
    damage: Schemas.Number,
    attackDistance: Schemas.Number,
    sheepIndex: Schemas.Number, //羊追従の配置を散らす
    damageCooldown: Schemas.Number,
    damageEntity: Schemas.Entity,
    heartEntity: Schemas.Entity,
    health: Schemas.Number,


    floatTimer: Schemas.Number, //浮く
    shakeTimer: Schemas.Number, //震える
    baseY: Schemas.Number //浮く
  },
  { health: 15 }
)
