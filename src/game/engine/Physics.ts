import RAPIER from '@dimforge/rapier3d';

export class Physics {
    private world: RAPIER.World;

    constructor() {
        this.world = new RAPIER.World({ x: 0.0, y: -9.81, z: 0.0 });
    }

    public async init() {
        // @ts-ignore
        await (RAPIER as any).init();
    }

    public getWorld(): RAPIER.World {
        return this.world;
    }

    public step() {
        this.world.step();
    }
}
