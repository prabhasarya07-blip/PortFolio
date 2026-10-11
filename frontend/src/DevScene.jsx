import React from 'react'
import MathScene from './MathScene'
import Nebula from './Nebula'

/* Locked background: GPU nebula + Vortex Pro particles. The other scenes and the picker were removed to keep the site fast. */
export const initialScene = () => 30
export function DevPicker() { return null }
export default function DevScene() {
  return (
    <>
      <Nebula />
      <MathScene scene={10} />
    </>
  )
}
