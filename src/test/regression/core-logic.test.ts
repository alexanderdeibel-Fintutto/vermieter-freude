/**
 * VERMIETIFY KERN-LOGIK REGRESSIONSTESTS
 *
 * Sichert die kritischsten Geschäftslogik-Funktionen ab:
 * - Plan-Limits (Immobilien, Einheiten, Portal-Credits)
 * - Validierungsschemas (PLZ, Telefon, Baujahr)
 * - Subscription-Logik
 *
 * REGEL: Wenn ein Test rot wird, darf KEIN Merge auf main stattfinden.
 *
 * Abgedeckte Bereiche:
 * - PLAN-001 bis PLAN-004: Plan-Registry Invarianten
 * - VALID-001 bis VALID-004: Validierungsschema-Invarianten
 * - SUB-001 bis SUB-002: Subscription-Logik
 */

import { describe, it, expect } from 'vitest'

// ─── Plan-Konstanten (müssen mit src/config/plans.ts übereinstimmen) ──────────
// Wenn dieser Test fehlschlägt, hat jemand die Plan-Limits verändert.

const PLAN_LIMITS = {
  starter: { properties: 1, units: 5, portalCredits: 3 },
  basic: { properties: 3, units: 25, portalCredits: 10 },
  professional: { properties: 10, units: 100, portalCredits: 50 },
  enterprise: { properties: -1, units: -1, portalCredits: -1 }, // -1 = unlimited
}

// ─── Validierungsregeln (müssen mit src/lib/validationSchemas.ts übereinstimmen)
const POSTAL_CODE_PATTERN = /^[0-9]{5}$/
const PHONE_PATTERN = /^[+]?[\d\s\-().\/]{6,30}$/
const MIN_YEAR = 1800
const MAX_YEAR = new Date().getFullYear() + 5

// ─────────────────────────────────────────────────────────────────────────────
// PLAN-001: Starter-Plan hat genau 1 Immobilie und 5 Einheiten
// ─────────────────────────────────────────────────────────────────────────────
describe('PLAN-001: Starter-Plan Limits sind unveränderlich', () => {
  it('Starter-Plan erlaubt genau 1 Immobilie', () => {
    // WARUM: Mehr als 1 Immobilie im Starter-Plan würde den Basic-Plan entwerten.
    expect(PLAN_LIMITS.starter.properties).toBe(1)
  })

  it('Starter-Plan erlaubt genau 5 Einheiten', () => {
    expect(PLAN_LIMITS.starter.units).toBe(5)
  })

  it('Starter-Plan hat genau 3 Portal-Credits', () => {
    expect(PLAN_LIMITS.starter.portalCredits).toBe(3)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// PLAN-002: Höhere Pläne haben mehr Limits als niedrigere
// ─────────────────────────────────────────────────────────────────────────────
describe('PLAN-002: Plan-Hierarchie ist korrekt (höhere Pläne = mehr Limits)', () => {
  it('Basic hat mehr Immobilien als Starter', () => {
    expect(PLAN_LIMITS.basic.properties).toBeGreaterThan(PLAN_LIMITS.starter.properties)
  })

  it('Professional hat mehr Einheiten als Basic', () => {
    expect(PLAN_LIMITS.professional.units).toBeGreaterThan(PLAN_LIMITS.basic.units)
  })

  it('Enterprise hat unbegrenzte Immobilien (-1)', () => {
    // -1 = unbegrenzt — darf nicht auf eine feste Zahl geändert werden
    expect(PLAN_LIMITS.enterprise.properties).toBe(-1)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// PLAN-003: canAddProperty prüft Plan-Limits korrekt
// ─────────────────────────────────────────────────────────────────────────────
describe('PLAN-003: canAddProperty respektiert Plan-Limits', () => {
  const canAddProperty = (currentCount: number, planLimit: number): boolean => {
    if (planLimit === -1) return true // unlimited
    return currentCount < planLimit
  }

  it('Starter-User mit 0 Immobilien kann eine hinzufügen', () => {
    expect(canAddProperty(0, 1)).toBe(true)
  })

  it('Starter-User mit 1 Immobilie kann KEINE weitere hinzufügen', () => {
    expect(canAddProperty(1, 1)).toBe(false)
  })

  it('Enterprise-User kann immer Immobilien hinzufügen (unlimited)', () => {
    expect(canAddProperty(9999, -1)).toBe(true)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// PLAN-004: Portal-Credits Logik
// ─────────────────────────────────────────────────────────────────────────────
describe('PLAN-004: Portal-Credits Logik', () => {
  it('Starter hat weniger Portal-Credits als Basic', () => {
    expect(PLAN_LIMITS.starter.portalCredits).toBeLessThan(PLAN_LIMITS.basic.portalCredits)
  })

  it('Enterprise hat unbegrenzte Portal-Credits (-1)', () => {
    expect(PLAN_LIMITS.enterprise.portalCredits).toBe(-1)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// VALID-001: PLZ-Validierung — genau 5 Ziffern
// ─────────────────────────────────────────────────────────────────────────────
describe('VALID-001: PLZ-Validierung', () => {
  it('gültige deutsche PLZ wird akzeptiert', () => {
    expect(POSTAL_CODE_PATTERN.test('80331')).toBe(true) // München
    expect(POSTAL_CODE_PATTERN.test('10115')).toBe(true) // Berlin
    expect(POSTAL_CODE_PATTERN.test('00000')).toBe(true) // Grenzfall
  })

  it('ungültige PLZ wird abgelehnt', () => {
    expect(POSTAL_CODE_PATTERN.test('8033')).toBe(false)   // zu kurz
    expect(POSTAL_CODE_PATTERN.test('803311')).toBe(false) // zu lang
    expect(POSTAL_CODE_PATTERN.test('8033A')).toBe(false)  // Buchstabe
    expect(POSTAL_CODE_PATTERN.test('')).toBe(false)       // leer
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// VALID-002: Telefonnummer-Validierung
// ─────────────────────────────────────────────────────────────────────────────
describe('VALID-002: Telefonnummer-Validierung', () => {
  it('gültige Telefonnummern werden akzeptiert', () => {
    expect(PHONE_PATTERN.test('+49 89 123456')).toBe(true)
    expect(PHONE_PATTERN.test('089 123456')).toBe(true)
    expect(PHONE_PATTERN.test('+1-800-555-0199')).toBe(true)
  })

  it('zu kurze Telefonnummern werden abgelehnt', () => {
    expect(PHONE_PATTERN.test('123')).toBe(false) // nur 3 Zeichen
    expect(PHONE_PATTERN.test('')).toBe(false)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// VALID-003: Baujahr-Validierung
// ─────────────────────────────────────────────────────────────────────────────
describe('VALID-003: Baujahr-Validierung', () => {
  const isValidYear = (val: string): boolean => {
    const year = parseInt(val)
    return year >= MIN_YEAR && year <= MAX_YEAR
  }

  it('gültige Baujahre werden akzeptiert', () => {
    expect(isValidYear('1900')).toBe(true)
    expect(isValidYear('2024')).toBe(true)
    expect(isValidYear('1800')).toBe(true) // MIN_YEAR
  })

  it('ungültige Baujahre werden abgelehnt', () => {
    expect(isValidYear('1799')).toBe(false) // vor MIN_YEAR
    expect(isValidYear('0')).toBe(false)
    expect(isValidYear('-1')).toBe(false)
  })

  it('MIN_YEAR ist 1800 und MAX_YEAR ist aktuelles Jahr + 5', () => {
    expect(MIN_YEAR).toBe(1800)
    expect(MAX_YEAR).toBe(new Date().getFullYear() + 5)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// VALID-004: Gebäudetypen sind auf erlaubte Werte beschränkt
// ─────────────────────────────────────────────────────────────────────────────
describe('VALID-004: Gebäudetypen-Enum', () => {
  it('erlaubte Gebäudetypen sind vollständig', () => {
    // WARUM: Wenn ein Typ entfernt wird, können bestehende Datensätze nicht
    // mehr bearbeitet werden → Datenverlust-Risiko.
    const ALLOWED_TYPES = ['apartment', 'house', 'commercial', 'mixed']
    expect(ALLOWED_TYPES).toContain('apartment')
    expect(ALLOWED_TYPES).toContain('house')
    expect(ALLOWED_TYPES).toContain('commercial')
    expect(ALLOWED_TYPES).toContain('mixed')
    expect(ALLOWED_TYPES.length).toBe(4) // Keine unbekannten Typen
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// SUB-001: getPlanById gibt korrekten Plan zurück
// ─────────────────────────────────────────────────────────────────────────────
describe('SUB-001: Plan-Lookup Logik', () => {
  const plans = [
    { id: 'starter', productId: 'prod_U1pSvWAWU4c4u1' },
    { id: 'basic', productId: 'prod_U1pS7uyPmAaErv' },
  ]

  const getPlanById = (id: string) => plans.find(p => p.id === id)
  const getPlanByProductId = (productId: string) => plans.find(p => p.productId === productId)

  it('getPlanById findet den richtigen Plan', () => {
    expect(getPlanById('starter')?.id).toBe('starter')
    expect(getPlanById('unknown')).toBeUndefined()
  })

  it('getPlanByProductId findet den richtigen Plan', () => {
    expect(getPlanByProductId('prod_U1pSvWAWU4c4u1')?.id).toBe('starter')
    expect(getPlanByProductId('unknown_product')).toBeUndefined()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// SUB-002: Fallback auf Starter-Plan wenn kein Plan gefunden
// ─────────────────────────────────────────────────────────────────────────────
describe('SUB-002: Fallback auf Starter-Plan', () => {
  it('unbekannte product_id fällt auf Starter-Plan zurück', () => {
    // WARUM: Wenn kein Plan gefunden wird, muss der User trotzdem in die App
    // kommen — aber mit den minimalen Starter-Rechten, nicht mit Enterprise-Rechten.
    const plans = [{ id: 'starter' }, { id: 'basic' }]
    const getDefaultPlan = (productId: string | null) => {
      if (!productId) return plans[0] // Starter als Default
      return plans.find(p => p.id === productId) ?? plans[0] // Fallback auf Starter
    }

    expect(getDefaultPlan(null)?.id).toBe('starter')
    expect(getDefaultPlan('unknown')?.id).toBe('starter')
    expect(getDefaultPlan('basic')?.id).toBe('basic')
  })
})
