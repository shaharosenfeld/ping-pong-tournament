"use client"

import { useEffect, useState } from 'react'
import confetti from 'canvas-confetti'

interface ConfettiEffectProps {
  trigger?: boolean
  type?: 'win' | 'tournament' | 'level-up' | 'celebration'
  duration?: number
  onComplete?: () => void
}

export const ConfettiEffect = ({
  trigger = false,
  type = 'win',
  duration = 1000,
  onComplete
}: ConfettiEffectProps) => {
  useEffect(() => {
    if (trigger) {
      const confettiCanvas = confetti.create(undefined, { 
        resize: true,
        useWorker: true
      })
      
      const defaults = {
        startVelocity: 30,
        spread: 360,
        ticks: 60,
        zIndex: 100,
        disableForReducedMotion: true
      }
      
      if (type === 'win' || type === 'celebration') {
        confettiCanvas({
          ...defaults,
          particleCount: 150,
          origin: { x: 0.5, y: 0.5 }
        })
      } else if (type === 'tournament') {
        confettiCanvas({
          particleCount: 200,
          spread: 100,
          origin: { y: 0.2, x: 0.5 },
          colors: ['#fecc00', '#ff0000', '#14d9e6', '#31ff8a'],
          zIndex: 100
        })
      } else if (type === 'level-up') {
        confettiCanvas({
          particleCount: 100,
          startVelocity: 45,
          spread: 90,
          origin: { x: 0.5, y: 0.7 },
          colors: ['#ffd700', '#ffdf00', '#fee101', '#fecc00'],
          ticks: 200,
          shapes: ['star'],
          zIndex: 100
        })
      }
      
      const timer = setTimeout(() => {
        if (onComplete) onComplete()
      }, duration)
      
      return () => {
        clearTimeout(timer)
      }
    }
  }, [trigger, type, duration, onComplete])

  return null
}

export default ConfettiEffect 