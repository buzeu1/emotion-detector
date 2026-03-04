"use client"

import { useRef, useEffect, useState, useCallback } from "react"
import { analizeazaCadru, type RezultatEmotie } from "@/lib/api"

// Culorile si emoji-urile pentru fiecare emotie (folosite pe canvas)
const EMOTII_CONFIG: Record<string, { culoare: string; emoji: string }> = {
  happy:    { culoare: "#64DC32", emoji: "😄" },
  sad:      { culoare: "#3282FF", emoji: "😢" },
  angry:    { culoare: "#FF3C3C", emoji: "😡" },
  fear:     { culoare: "#D232C8", emoji: "😨" },
  surprise: { culoare: "#E6D232", emoji: "😲" },
  disgust:  { culoare: "#32B400", emoji: "🤢" },
  neutral:  { culoare: "#B4B4B4", emoji: "😐" },
}

interface Props {
  // Functie apelata de fiecare data cand vine un raspuns de la server
  onRezultat: (r: RezultatEmotie) => void
}

export default function WebcamCapture({ onRezultat }: Props) {
  const videoRef   = useRef<HTMLVideoElement>(null)   // elementul video al camerei
  const overlayRef = useRef<HTMLCanvasElement>(null)  // canvas-ul cu dreptunghiul + emoji

  const [eroare, setEroare]   = useState<string | null>(null)
  const [pornita, setPornita] = useState(false)

  // ── 1. Porneste webcam-ul ─────────────────────────────────────────
  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          setPornita(true)
        }
      })
      .catch(() =>
        setEroare("Nu am putut accesa camera. Permite accesul in browser.")
      )

    // Opreste camera cand componenta dispare din pagina
    return () => {
      const stream = videoRef.current?.srcObject as MediaStream | null
      stream?.getTracks().forEach((track) => track.stop())
    }
  }, [])

  // ── 2. Deseneaza dreptunghi + emoji pe canvas ─────────────────────
  const deseneazaOverlay = useCallback((rezultat: RezultatEmotie) => {
    const canvas = overlayRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")!
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Daca nu e detectata nicio fata, nu deseneam nimic
    if (!rezultat.dreptunghi || !rezultat.emotie_dominanta) return

    const { x, y, w, h } = rezultat.dreptunghi
    const config = EMOTII_CONFIG[rezultat.emotie_dominanta] ?? EMOTII_CONFIG.neutral

    // Dreptunghi colorat in jurul fetei
    ctx.strokeStyle = config.culoare
    ctx.lineWidth   = 3
    ctx.strokeRect(x, y, w, h)

    // Emoji deasupra fetei (marimea depinde de latimea fetei)
    ctx.font      = `${Math.max(28, w * 0.4)}px serif`
    ctx.textAlign = "center"
    ctx.fillText(config.emoji, x + w / 2, Math.max(30, y - 8))
  }, [])

  // ── 3. Captureaza cadre si trimite la server (la fiecare 300ms) ───
  useEffect(() => {
    if (!pornita) return

    // Canvas ascuns folosit pentru a captura frame-ul din video
    const capturaCanvas    = document.createElement("canvas")
    const LATIME_CAPTURA   = 640
    const INALTIME_CAPTURA = 480

    const interval = setInterval(async () => {
      const video = videoRef.current
      if (!video || video.readyState < 2) return  // video-ul inca se incarca

      // Setam dimensiunile canvas-ului de captura (o singura data)
      if (capturaCanvas.width !== LATIME_CAPTURA) {
        capturaCanvas.width  = LATIME_CAPTURA
        capturaCanvas.height = INALTIME_CAPTURA
      }

      // Sincronizam si overlay canvas-ul la aceeasi rezolutie
      if (overlayRef.current) {
        overlayRef.current.width  = LATIME_CAPTURA
        overlayRef.current.height = INALTIME_CAPTURA
      }

      // Desenam frame-ul curent in canvas-ul de captura
      capturaCanvas.getContext("2d")!.drawImage(video, 0, 0, LATIME_CAPTURA, INALTIME_CAPTURA)

      // Convertim la base64 JPEG (0.8 = calitate 80%, echilibru viteza/calitate)
      const base64 = capturaCanvas.toDataURL("image/jpeg", 0.8).split(",")[1]

      try {
        const rezultat = await analizeazaCadru(base64)
        onRezultat(rezultat)
        deseneazaOverlay(rezultat)
      } catch {
        // Ignoram erorile izolate de retea (retry automat la urmatorul interval)
      }
    }, 300)

    return () => clearInterval(interval)
  }, [pornita, onRezultat, deseneazaOverlay])

  // ── Afisare eroare daca nu se poate accesa camera ─────────────────
  if (eroare) {
    return (
      <div className="flex items-center justify-center p-8 text-red-400 text-center rounded-xl border border-red-900 bg-red-950/30">
        {eroare}
      </div>
    )
  }

  // ── Afisare camera + canvas suprapus ──────────────────────────────
  // scaleX(-1) oglindeste tot containerul (mod selfie)
  return (
    <div className="relative w-full h-full md:w-auto md:h-auto md:inline-block" style={{ transform: "scaleX(-1)" }}>
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className="block w-full h-full object-cover md:w-auto md:h-auto md:object-none md:max-h-[85vh] md:rounded-xl"
      />
      {/* Canvas-ul e pozitionat exact peste video, deseneaza dreptunghiul si emoji-ul */}
      <canvas
        ref={overlayRef}
        className="absolute inset-0 w-full h-full"
      />
    </div>
  )
}
