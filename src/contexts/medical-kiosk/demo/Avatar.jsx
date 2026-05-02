import React, { useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import Voice from './Voice'

/**
 * Avatar Component (Lip Sync Enabled)
 * Karakter yüklendiğinde gltfjsx ile güncellenecek.
 */
export function Avatar(props) {
  const { gender = 'female', ...rest } = props;
  const group = useRef()
  const headRef = useRef()
  const mouthRef = useRef()
  const leftEyeRef = useRef()
  const rightEyeRef = useRef()
  const mousePos = useRef({ x: 0, y: 0 })

  // Mouse takibi
  useEffect(() => {
    const handleMouseMove = (e) => {
      mousePos.current = {
        x: (e.clientX / window.innerWidth - 0.5) * 2,
        y: (e.clientY / window.innerHeight - 0.5) * 2
      }
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])
  
  // Karakter hareket animasyonu ve Lip Sync
  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime()
    
    // Genel Salınım
    if (group.current) {
      const baseY = props.position ? props.position[1] : 0;
      group.current.position.y = baseY + Math.sin(t * 1.5) * 0.03;
      group.current.rotation.y = Math.sin(t * 0.5) * 0.05;
    }

    if (headRef.current) {
      headRef.current.rotation.y = THREE.MathUtils.lerp(
        headRef.current.rotation.y,
        mousePos.current.x * 0.35,
        0.05
      )
      headRef.current.rotation.x = THREE.MathUtils.lerp(
        headRef.current.rotation.x,
        mousePos.current.y * 0.2 + Math.sin(t * 1.2) * 0.02,
        0.05
      )
      headRef.current.rotation.z = Math.sin(t * 0.8) * 0.02
    }

    const audioLevel = Voice.getAudioLevel()

    if (mouthRef.current) {
      const targetScaleY = 1.0 + audioLevel * 1.5; 
      const targetScaleX = 1.0 + audioLevel * 0.2;
      mouthRef.current.scale.y = THREE.MathUtils.lerp(mouthRef.current.scale.y, targetScaleY, 0.2);
      mouthRef.current.scale.x = THREE.MathUtils.lerp(mouthRef.current.scale.x, targetScaleX, 0.2);
    }
    
    if (leftEyeRef.current && rightEyeRef.current) {
      const targetEyeX = mousePos.current.x * 0.04;
      const targetEyeY = -mousePos.current.y * 0.04;
      
      leftEyeRef.current.position.x = THREE.MathUtils.lerp(leftEyeRef.current.position.x, -0.1 + targetEyeX, 0.1);
      leftEyeRef.current.position.y = THREE.MathUtils.lerp(leftEyeRef.current.position.y, 0.05 + targetEyeY, 0.1);
      
      rightEyeRef.current.position.x = THREE.MathUtils.lerp(rightEyeRef.current.position.x, 0.1 + targetEyeX, 0.1);
      rightEyeRef.current.position.y = THREE.MathUtils.lerp(rightEyeRef.current.position.y, 0.05 + targetEyeY, 0.1);

      const blink = Math.random() > 0.99 ? 0.1 : 1;
      leftEyeRef.current.scale.y = THREE.MathUtils.lerp(leftEyeRef.current.scale.y, blink, 0.5);
      rightEyeRef.current.scale.y = THREE.MathUtils.lerp(rightEyeRef.current.scale.y, blink, 0.5);
    }
  })

  // Renkler (Kadın/Erkek seçimine göre dinamik)
  const isFemale = gender === 'female';
  const primaryColor = new THREE.Color(isFemale ? '#ec4899' : '#003CBD') // Pembe veya Mavi
  const bodyColor = new THREE.Color('#ffffff')
  const eyeColor = new THREE.Color(isFemale ? '#f472b6' : '#38bdf8')

  return (
    <group ref={group} {...rest} dispose={null}>
      {/* --- GÖVDE --- */}
      <mesh position={[0, -0.3, 0]}>
        <cylinderGeometry args={[0.25, 0.35, 0.6, 32]} />
        <meshStandardMaterial color={bodyColor} roughness={0.2} metalness={0.1} clearcoat={1} />
      </mesh>
      
      <mesh position={[0, -0.2, 0.31]}>
        <boxGeometry args={[0.2, 0.15, 0.05]} />
        <meshStandardMaterial color="#0f172a" roughness={0.4} />
      </mesh>
      <mesh position={[0, -0.2, 0.33]}>
        <planeGeometry args={[0.15, 0.05]} />
        <meshBasicMaterial color="#10b981" />
      </mesh>

      {/* Boyun Mafsalı */}
      <mesh position={[0, 0.05, 0]}>
        <cylinderGeometry args={[0.06, 0.08, 0.1, 16]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.5} roughness={0.2} />
      </mesh>

      {/* --- KAFA --- */}
      <group ref={headRef} position={[0, 0.35, 0]}>
        {/* Yuvarlak Tatlı Kafa */}
        <mesh>
          <sphereGeometry args={[0.3, 64, 64]} />
          <meshStandardMaterial color={bodyColor} roughness={0.1} metalness={0.1} clearcoat={1} />
        </mesh>

        {/* Kulaklar */}
        <mesh position={[-0.32, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <capsuleGeometry args={[0.05, 0.1, 16, 16]} />
          <meshStandardMaterial color={primaryColor} emissive={primaryColor} emissiveIntensity={0.5} />
        </mesh>
        <mesh position={[0.32, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <capsuleGeometry args={[0.05, 0.1, 16, 16]} />
          <meshStandardMaterial color={primaryColor} emissive={primaryColor} emissiveIntensity={0.5} />
        </mesh>

        {/* Vizör */}
        <mesh position={[0, 0, 0.22]}>
          <boxGeometry args={[0.45, 0.3, 0.2]} />
          <meshStandardMaterial color="#0f172a" roughness={0.1} metalness={0.8} />
        </mesh>

        {/* Kurdele (Sadece Kadınsa) */}
        {isFemale && (
          <group position={[0.15, 0.25, 0.15]} rotation={[0, 0, -Math.PI / 8]}>
            <mesh position={[-0.06, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
              <coneGeometry args={[0.08, 0.12, 16]} />
              <meshStandardMaterial color={primaryColor} />
            </mesh>
            <mesh position={[0.06, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
              <coneGeometry args={[0.08, 0.12, 16]} />
              <meshStandardMaterial color={primaryColor} />
            </mesh>
            <mesh>
              <sphereGeometry args={[0.04, 16, 16]} />
              <meshStandardMaterial color="#be185d" />
            </mesh>
          </group>
        )}

        {/* --- YÜZ İFADESİ --- */}
        <mesh ref={leftEyeRef} position={[-0.1, 0.05, 0.32]}>
          <capsuleGeometry args={[0.03, 0.06, 16, 16]} />
          <meshBasicMaterial color={eyeColor} />
        </mesh>

        <mesh ref={rightEyeRef} position={[0.1, 0.05, 0.32]}>
          <capsuleGeometry args={[0.03, 0.06, 16, 16]} />
          <meshBasicMaterial color={eyeColor} />
        </mesh>

        {/* Gülen Surat */}
        <mesh ref={mouthRef} position={[0, -0.02, 0.32]} rotation={[0, 0, Math.PI]}>
          <torusGeometry args={[0.07, 0.015, 16, 32, Math.PI]} />
          <meshBasicMaterial color={eyeColor} />
        </mesh>
      </group>
    </group>
  )
}

export default Avatar;
