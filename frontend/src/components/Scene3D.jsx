import { useEffect, useRef } from 'react'

export default function Scene3D() {
  const ref = useRef(null)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined
    let disposed = false
    let cleanup = () => {}

    import('three').then((THREE) => {
      const el = ref.current
      if (disposed || !el) return
      let renderer
      try {
        renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
      } catch (e) {
        return
      }
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
      el.appendChild(renderer.domElement)

      const scene = new THREE.Scene()
      const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 100)
      camera.position.z = 8
      const group = new THREE.Group()
      scene.add(group)

      const knotGeo = new THREE.TorusKnotGeometry(1.9, 0.5, 180, 24)
      const knotMat = new THREE.MeshBasicMaterial({ color: 0x6366f1, wireframe: true, transparent: true, opacity: 0.35 })
      const knot = new THREE.Mesh(knotGeo, knotMat)
      const icoGeo = new THREE.IcosahedronGeometry(0.8, 1)
      const icoMat = new THREE.MeshBasicMaterial({ color: 0x22d3ee, wireframe: true, transparent: true, opacity: 0.6 })
      const ico = new THREE.Mesh(icoGeo, icoMat)
      group.add(knot, ico)

      const count = window.innerWidth < 700 ? 250 : 700
      const pos = new Float32Array(count * 3)
      for (let i = 0; i < count; i++) {
        const r = 6 + Math.random() * 8
        const t = Math.random() * Math.PI * 2
        const p = Math.acos(2 * Math.random() - 1)
        pos[i * 3] = r * Math.sin(p) * Math.cos(t)
        pos[i * 3 + 1] = r * Math.sin(p) * Math.sin(t)
        pos[i * 3 + 2] = r * Math.cos(p)
      }
      const ptsGeo = new THREE.BufferGeometry()
      ptsGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
      const ptsMat = new THREE.PointsMaterial({ color: 0x8b9cff, size: 0.05, transparent: true, opacity: 0.8 })
      const points = new THREE.Points(ptsGeo, ptsMat)
      scene.add(points)

      const resize = () => {
        const w = el.clientWidth || 1
        const h = el.clientHeight || 1
        renderer.setSize(w, h)
        camera.aspect = w / h
        camera.updateProjectionMatrix()
        group.position.x = w > 860 ? 3.4 : 0
        group.scale.setScalar(w > 860 ? 1 : 0.75)
      }
      resize()
      window.addEventListener('resize', resize)

      const mouse = { x: 0, y: 0 }
      const onMove = (e) => {
        mouse.x = e.clientX / window.innerWidth - 0.5
        mouse.y = e.clientY / window.innerHeight - 0.5
      }
      window.addEventListener('pointermove', onMove)

      let visible = true
      const io = new IntersectionObserver(([en]) => { visible = en.isIntersecting })
      io.observe(el)

      let raf = 0
      const loop = () => {
        raf = requestAnimationFrame(loop)
        if (!visible) return
        knot.rotation.x += 0.0035
        knot.rotation.y += 0.0055
        ico.rotation.x -= 0.006
        ico.rotation.y += 0.008
        points.rotation.y += 0.0006
        group.rotation.y += (mouse.x * 0.8 - group.rotation.y) * 0.04
        group.rotation.x += (mouse.y * 0.8 - group.rotation.x) * 0.04
        camera.position.x += (mouse.x * 1.2 - camera.position.x) * 0.03
        renderer.render(scene, camera)
      }
      loop()

      cleanup = () => {
        cancelAnimationFrame(raf)
        window.removeEventListener('resize', resize)
        window.removeEventListener('pointermove', onMove)
        io.disconnect()
        ;[knotGeo, knotMat, icoGeo, icoMat, ptsGeo, ptsMat].forEach((o) => o.dispose())
        renderer.dispose()
        if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement)
      }
    })

    return () => {
      disposed = true
      cleanup()
    }
  }, [])

  return <div className="scene" ref={ref} aria-hidden="true" />
}
