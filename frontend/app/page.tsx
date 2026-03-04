"use client"

import { useState } from "react"
import WebcamCapture from "@/components/WebcamCapture"
import EmotionOverlay from "@/components/EmotionOverlay"
import { type RezultatEmotie } from "@/lib/api"

export default function Home() {
  // Stocam ultimul rezultat primit de la server
  const [rezultat, setRezultat] = useState<RezultatEmotie | null>(null)

  return (
    <main className="flex h-screen bg-gray-950 text-white overflow-hidden">

      {/* ── Stanga: camera video cu overlay canvas ── */}
      <div className="flex-1 flex items-center justify-center p-6">
        <WebcamCapture onRezultat={setRezultat} />
      </div>

      {/* ── Dreapta: panel cu emotiile ── */}
      <EmotionOverlay rezultat={rezultat} />

    </main>
  )
}
