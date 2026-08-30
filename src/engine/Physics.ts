import * as THREE from 'three';
import { World } from '@dimforge/rapier3d';

export class Physics {
  public world: World;
  constructor() {
    this.world = new World({ gravity: new THREE.Vector3(0, -9.81, 0) });
  }

  public addSoftBody(mesh: THREE.Mesh): void {
    // Stub: physics integration not yet implemented.
  }
}
