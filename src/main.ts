import './style.css'
import * as THREE from 'three'
import { Scene } from './game/engine/Scene'
import { AudioAnalyzer } from './game/audio/AudioAnalyzer'
import { UIManager } from './game/ui/UIManager'
import { Orb } from './game/entities/Orb'
import { Highway } from './game/entities/Highway'
import { Physics } from './game/engine/Physics'

const app = document.querySelector<HTMLDivElement>('#app')!
const scene = new Scene(app)

const analyzer = new AudioAnalyzer()
const ui = new UIManager(document.getElementById('ui-layer')!, analyzer)

const physics = new Physics()
const orb = new Orb(scene.getScene(), physics.getWorld())
const highway = new Highway(scene.getScene(), physics.getWorld())
const clock = new THREE.Clock()

async function start() {
    await physics.init()
    scene.start()
    animate()
}

function animate() {
    const elapsedTime = clock.getElapsedTime()
    const volume = analyzer.getVolume()
    const intensity = volume / 255 

    physics.step()

    orb.update(elapsedTime, intensity)
    highway.update(elapsedTime, intensity)

    requestAnimationFrame(animate)
}

start()
