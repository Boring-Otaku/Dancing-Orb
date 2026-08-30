import * as THREE from 'three'
import { World, RigidBody, RigidBodyDesc, Collider, ColliderDesc, RapierRigidBodyType } from '@dimforge/rapier3d'

export class Physics {
  public world: World
  constructor() {
    this.world = new World({ gravity: new THREE.Vector3(0, -9.81, 0) })
  }

  public addSoftBody(mesh: THREE.Mesh) {
    const collider = Collider::
  }
}
