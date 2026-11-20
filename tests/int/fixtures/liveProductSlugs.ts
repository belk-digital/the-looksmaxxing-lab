/**
 * Snapshot of every product address on the live site (read from https://longeviaresearch.com/sitemap.xml on
 * 2026-11-10, 98 products). Used to prove the nasal-spray rule sorts the REAL catalogue correctly.
 * If products are added, this file does not need updating for the tests to be meaningful, but it can be refreshed.
 */

/** The 49 nasal-spray products. */
export const SPRAY_SLUGS: string[] = [
  "5-amino-1-50mg-spray",
  "ahk-cu-spray",
  "aod-9604-spray",
  "ara-290-10mg-spray",
  "bpc-157-spray",
  "bpc-157-tb-500-spray",
  "cagrilintide-10mg-spray",
  "cjc-1295-no-dac-10mg-spray",
  "cjc-1295-with-dac-5mg-spray",
  "cjc-ipamorelin-5mg-5mg-spray",
  "dihexa-10mg-45-sprays",
  "dsip-10mg-90-sprays",
  "epithalon-10mg-50mg-45-sprays",
  "ghk-cu-50mg-100mg-45-sprays",
  "ghrp-2-100mg-45-sprays",
  "ghrp-6-10mg-45-sprays",
  "glow-70mg-45-sprays",
  "glp-3rta-spray",
  "glutathione-spray",
  "h-frag-5mg-45-sprays",
  "hcg-5000iu-10000iu-45-sprays",
  "igf-lr3-1mg-45-sprays",
  "ipamorelin-5mg-10mg-45-sprays",
  "kisspeptin-10mg-45-sprays",
  "klow-80mg-45-sprays",
  "kpv-10mg-45-sprays",
  "l-carnitine-400mg-45-sprays",
  "lipo-c-120mg-45-sprays",
  "ll-37-1mg-45-sprays",
  "melanotan-1-10mg-45-sprays",
  "melanotan-ii-10mg-45-sprays",
  "mots-c-10mg-40mg-45-sprays",
  "mt2-spray",
  "nad-plus-500mg-1000mg-45-sprays",
  "oxytocin-10mg-90-sprays",
  "pt-141-10mg-45-sprays",
  "selank-10mg-90-sprays",
  "semaglutide-5mg-10mg-20mg-30mg-45-sprays",
  "semax-10mg-30mg-90-sprays",
  "semax-selank-10mg-10mg-90-sprays",
  "sermorelin-10mg-20mg-45-sprays",
  "snap-8-10mg-20mg-45-sprays",
  "ss-31-10mg-50mg-45-sprays",
  "tb-500-5mg-10mg-45-sprays",
  "tesa-ipa-6mg-3mg-13mg-3mg-45-sprays",
  "tesamorelin-10mg-20mg-45-sprays",
  "thymosin-alpha-1-10mg-45-sprays",
  "tirzepatide-10mg-20mg-30mg-60mg-45-sprays",
  "vip-10mg-90-sprays",
]

/** The 49 other (vial and supply) products. */
export const NON_SPRAY_SLUGS: string[] = [
  "5-amino-1mq",
  "ahk-cu",
  "aod-9604",
  "ara-290",
  "bpc-157",
  "bpc-tb-500",
  "cagrilintide",
  "cjc-1295-no-dac",
  "cjc-1295-w-dac",
  "cjc-ipamorelin",
  "dihexa-10mg",
  "dsip",
  "epithalon",
  "ghk-cu",
  "ghrp-6",
  "glow-blend",
  "glp-3rta",
  "glutathione",
  "h-frag",
  "hcg",
  "igf-1-lr3",
  "ipamorelin",
  "kisspeptin",
  "klow-blend",
  "kpv",
  "l-carnitine",
  "lipo-c",
  "ll-37",
  "melanotan-1",
  "melanotan-ii",
  "mots-c",
  "nad-plus",
  "oxytocin",
  "pinealon",
  "pt-141",
  "reconstitution-solution",
  "selank",
  "semaglutide",
  "semax",
  "semax-selank",
  "sermorelin",
  "snap-8",
  "ss-31",
  "tb-500",
  "tesa-ipa",
  "tesamorelin",
  "thymosin-alpha-1",
  "tirzepatide",
  "vip",
]

/**
 * Vial products that are members-only because of WHICH COMPOUND they are (GLP-3RTA, Tirzepatide, Semaglutide),
 * not because of their format. Added 2026-11-20. Their spray versions are already in SPRAY_SLUGS.
 */
export const GATED_COMPOUND_VIAL_SLUGS: string[] = ["glp-3rta", "semaglutide", "tirzepatide"]

/** Everything a logged-out visitor can see: the vial and supply products that are not members-only (46). */
export const PUBLIC_SLUGS: string[] = NON_SPRAY_SLUGS.filter((slug) => !GATED_COMPOUND_VIAL_SLUGS.includes(slug))

/** Everything a logged-out visitor can NOT see: all 49 sprays plus the 3 gated vial products (52). */
export const MEMBERS_ONLY_SLUGS: string[] = [...SPRAY_SLUGS, ...GATED_COMPOUND_VIAL_SLUGS]
