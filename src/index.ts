import { engine, GltfContainer, Transform } from '@dcl/sdk/ecs'
import { Vector3 } from '@dcl/sdk/math'
import { createZombie } from './modules/sheep'
import { setupUi } from './ui'
import { setupRushButton } from './modules/rushSheep'

export function main() {
  // Instantiate base model
  // const baseModelEntity = engine.addEntity()
  // Transform.create(baseModelEntity, {
  //   scale: Vector3.create(2, 1, 2)
  // })
  // GltfContainer.create(baseModelEntity, {
  //  src: 'assets/scene/Models/baseLight.glb'
  // })

  for (let i = 0; i < 4; i++) {
    createZombie(
     Vector3.create(1 + Math.random() * 30, 0, 1 + Math.random() * 30),
     'assets/scene/models/zombie_nohead.glb',
      Math.random() * 0.4 + 0.3,
      Math.random() * 1.2 + 0.8,
      i
    )
  }

  for (let i = 0; i < 5; i++) {
   createZombie(
      Vector3.create(1 + Math.random() * 30, 0, 1 + Math.random() * 30),
     'assets/scene/models/greensheep.glb',
      Math.random() * 0.4 + 0.2,
      Math.random() * 2.0 + 1.5,
      i + 4
    )
  }



 // createZombie(Vector3.create(1 + Math.random() * 30, 0.933, 1 + Math.random() * 30))
 //今は2回呼び出さないで1匹だけにする

  //ボーナスタイムボタン
  setupRushButton()

  // UI with GitHub link
  setupUi()
}
