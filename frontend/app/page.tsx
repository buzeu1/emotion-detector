"use client"

import { useState } from "react"
import WebcamCapture from "@/components/WebcamCapture"
import EmotionOverlay from "@/components/EmotionOverlay"
import { type RezultatEmotie } from "@/lib/api"

export default function Home() {
  // Stocam ultimul rezultat primit de la server
  const [rezultat, setRezultat] = useState<RezultatEmotie | null>(null)

  return (
    <main className="flex flex-col md:flex-row h-dvh md:h-screen bg-gray-950 text-white overflow-hidden">

      {/* ── Sus (mobil) / Stanga (desktop): camera video cu overlay canvas ── */}
      <div className="flex-[3] min-h-0 md:flex-1 overflow-hidden md:flex md:items-center md:justify-center md:p-6">
        <WebcamCapture onRezultat={setRezultat} />
      </div>

      {/* ── Dreapta: panel cu emotiile ── */}
      <EmotionOverlay rezultat={rezultat} />

    </main>
  )
}
