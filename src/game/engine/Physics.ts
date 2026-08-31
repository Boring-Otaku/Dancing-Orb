import * as RAPIER from '@dimforge/rapier3d';

/**
 * Physics - Manages the Rapier physics world
 * Handles physics simulation and rigid body creation
 */
export class Physics {
  private world: RAPIER.World | null = null;
  private isInitialized: boolean = false;

  constructor() {}

  /**
   * Initialize the physics engine with default gravity
   */
  public async init(): Promise<void> {
    if (this.isInitialized) return;

    try {
      await RAPIER.init();
      this.world = new RAPIER.World({ x: 0.0, y: -9.81, z: 0.0 });
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize Physics engine:', error);
      throw new Error('Physics initialization failed');
    }
  }

  /**
   * Get the physics world instance
   * @throws Error if not initialized
   */
  public getWorld(): RAPIER.World {
    if (!this.world) {
      throw new Error('Physics world not initialized. Call init() first.');
    }
    return this.world;
  }

  /**
   * Step the physics simulation forward by one frame
   */
  public step(): void {
    if (this.world && this.isInitialized) {
      this.world.step();
    }
  }

  /**
   * Check if physics engine is initialized and ready
   */
  public isReady(): boolean {
    return this.isInitialized && this.world !== null;
  }

  /**
   * Set gravity for the physics world
   * @param x - X component of gravity
   * @param y - Y component of gravity  
   * @param z - Z component of gravity
   */
  public setGravity(x: number, y: number, z: number): void {
    if (this.world) {
      this.world.gravity = { x, y, z };
    }
  }

  /**
   * Create a static rigid body (ground/fixed object)
   * @param position - Position vector
   * @returns Created rigid body
   */
  public createStaticBody(position: { x: number; y: number; z: number }): RAPIER.RigidBody {
    const world = this.getWorld();
    const rigidBodyDesc = RAPIER.RigidBodyDesc.fixed().setTranslation(position.x, position.y, position.z);
    return world.createRigidBody(rigidBodyDesc);
  }

  /**
   * Create a dynamic rigid body (movable object)
   * @param position - Position vector
   * @returns Created rigid body
   */
  public createDynamicBody(position: { x: number; y: number; z: number }): RAPIER.RigidBody {
    const world = this.getWorld();
    const rigidBodyDesc = RAPIER.RigidBodyDesc.dynamic().setTranslation(position.x, position.y, position.z);
    return world.createRigidBody(rigidBodyDesc);
  }

  /**
   * Create a box collider attached to a rigid body
   * @param body - Parent rigid body
   * @param halfExtents - Half dimensions [x, y, z]
   * @returns Created collider
   */
  public createBoxCollider(
    body: RAPIER.RigidBody, 
    halfExtents: [number, number, number]
  ): RAPIER.Collider {
    const world = this.getWorld();
    const colliderDesc = RAPIER.ColliderDesc.cuboid(halfExtents[0], halfExtents[1], halfExtents[2]);
    return world.createCollider(colliderDesc, body);
  }

  /**
   * Create a sphere collider attached to a rigid body
   * @param body - Parent rigid body
   * @param radius - Sphere radius
   * @returns Created collider
   */
  public createSphereCollider(body: RAPIER.RigidBody, radius: number): RAPIER.Collider {
    const world = this.getWorld();
    const colliderDesc = RAPIER.ColliderDesc.ball(radius);
    return world.createCollider(colliderDesc, body);
  }

  /**
   * Cleanup physics resources
   */
  public dispose(): void {
    if (this.world) {
      // Note: Rapier3D doesn't have a built-in cleanup method
      // The world will be garbage collected when no longer referenced
      this.world = null;
    }
    this.isInitialized = false;
  }
}
