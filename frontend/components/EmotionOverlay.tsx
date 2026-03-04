"use client"

import { type RezultatEmotie } from "@/lib/api"

// Configuratia fiecarei emotii: nume in romana, poza, emoji fallback, culoare
const EMOTII: Record<string, { nume: string; poza: string; emoji: string; culoare: string }> = {
  happy:    { nume: "Fericit",   poza: "/images/fericit.jpg",   emoji: "😄", culoare: "#64DC32" },
  sad:      { nume: "Trist",     poza: "/images/trist.jpg",     emoji: "😢", culoare: "#3282FF" },
  angry:    { nume: "Supărat",   poza: "/images/infuriat.jpg",  emoji: "😡", culoare: "#FF3C3C" },
  fear:     { nume: "Speriat",   poza: "/images/speriat.jpg",   emoji: "😨", culoare: "#D232C8" },
  surprise: { nume: "Surprins",  poza: "/images/surprins.jpg",  emoji: "😲", culoare: "#E6D232" },
  disgust:  { nume: "Dezgustat", poza: "/images/desgustat.jpg", emoji: "🤢", culoare: "#32B400" },
  neutral:  { nume: "Neutru",    poza: "/images/neutru.jpg",    emoji: "😐", culoare: "#B4B4B4" },
}

const ORDINE = ["happy", "sad", "angry", "fear", "surprise", "disgust", "neutral"]

interface Props {
  rezultat: RezultatEmotie | null
}

export default function EmotionOverlay({ rezultat }: Props) {
  const emotieActiva = rezultat?.emotie_dominanta ?? "neutral"
  const valori       = rezultat?.emotii ?? {}
  const config       = EMOTII[emotieActiva] ?? EMOTII.neutral
  const fatagasita   = rezultat !== null && rezultat.emotie_dominanta !== null

  return (
    <aside className="flex-[2] overflow-y-auto md:flex-none w-full md:w-72 md:min-h-screen bg-gray-900 border-t md:border-t-0 md:border-l border-gray-800 flex flex-col p-4 md:p-6 gap-4 md:gap-6">

      {/* ── Poza emotiei + Emotia dominanta ── */}
      <div className="flex md:flex-col items-center gap-4 md:pt-4">
        <img
          src={config.poza}
          alt={config.nume}
          className="w-24 h-24 md:w-44 md:h-44 object-cover rounded-xl flex-shrink-0"
        />

        <div className="flex flex-col gap-1">
          <span
            className="text-xl font-bold"
            style={{ color: config.culoare }}
          >
            {fatagasita ? config.nume : "—"}
          </span>

          {fatagasita && rezultat?.incredere != null && (
            <span className="text-sm text-gray-400">
              {Math.round(rezultat.incredere * 100)}% incredere
            </span>
          )}

          {/* Mesaj cand nu e fata in imagine */}
          {rezultat !== null && !fatagasita && (
            <span className="text-sm text-gray-500">
              Nu am detectat nicio față
            </span>
          )}
        </div>
      </div>

      <hr className="border-gray-700" />

      {/* ── Lista tuturor emotiilor cu bare de progres ── */}
      <div className="flex flex-col gap-3 md:gap-4">
        {ORDINE.map((emotie) => {
          const info    = EMOTII[emotie]
          const val     = valori[emotie] ?? 0
          const activa  = emotie === emotieActiva

          return (
            <div key={emotie}>
              {/* Numele emotiei + procentul */}
              <div className="flex justify-between items-center mb-1">
                <span
                  className="text-sm font-medium transition-colors duration-300"
                  style={{ color: activa ? info.culoare : "#6b7280" }}
                >
                  {info.emoji} {info.nume}
                </span>
                <span className="text-xs text-gray-400">
                  {Math.round(val * 100)}%
                </span>
              </div>

              {/* Bara de progres */}
              <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${val * 100}%`,
                    backgroundColor: activa ? info.culoare : "#374151",
                  }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </aside>
  )
}
