// URL-ul backend-ului — setat in .env.local
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

// ── Tipuri de date ────────────────────────────────────────────────────

export interface Dreptunghi {
  x: number  // pozitia stanga a fetei (pixeli)
  y: number  // pozitia de sus a fetei (pixeli)
  w: number  // latimea fetei (pixeli)
  h: number  // inaltimea fetei (pixeli)
}

export interface RezultatEmotie {
  emotie_dominanta: string | null          // ex: "happy" — null daca nu e fata
  incredere: number | null                 // 0.0 → 1.0
  emotii: Record<string, number> | null   // toate cele 7 emotii cu scoruri
  dreptunghi: Dreptunghi | null           // pozitia fetei in imagine
}

// ── Functie de apel API ───────────────────────────────────────────────

/**
 * Trimite un cadru video (base64) la server si primeste emotiile detectate.
 */
export async function analizeazaCadru(imageBase64: string): Promise<RezultatEmotie> {
  const raspuns = await fetch(`${API_URL}/analyze/frame`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image: imageBase64 }),
  })

  if (!raspuns.ok) throw new Error("Eroare la server")
  return raspuns.json()
}
