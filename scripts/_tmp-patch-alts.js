const fs = require('fs')
const path = require('path')

const dir = path.join(__dirname, '..', 'docs', 'Journal')

const patches = {
  'Pinealon-guide.json': 'Lyophilized Pinealon peptide vial with insulin syringe and bacteriostatic water beside a molecular structure diagram showing Glu-Asp-Arg tripeptide on a dark laboratory countertop with scientific equipment and dramatic side lighting.',
  'Glutathione-for-skin.json': 'Lyophilized reduced glutathione vial with insulin syringe beside a molecular structure diagram showing GSH tripeptide and skin cross-section illustration on a dark laboratory countertop with scientific equipment and cool blue accent lighting.',
  'Peptide Dosage Calculations.json': 'Lyophilized peptide vial beside insulin syringe and calculator displaying dosage calculation, with printed concentration chart showing mg to mL conversions on a dark laboratory countertop with scientific equipment and warm desk lamp lighting.',
  'How Long Do Peptides Last After Reconstitution.json': 'Open refrigerator showing peptide vials stored at 2-8°C with digital thermometer displaying 4°C, beside a printed stability timeline chart showing 28-day reconstitution window on a laboratory shelf with cool white LED lighting.',
  'Best Research Peptides to Know About in 2026.json': 'Array of lyophilized peptide vials labeled with compound names including Semaglutide, BPC-157, GHK-Cu, and Tirzepatide, with molecular structure diagrams and 2026 research trends text overlay on a dark laboratory countertop with cool blue accent lighting.',
}

for (const [file, alt] of Object.entries(patches)) {
  const p = path.join(dir, file)
  const draft = JSON.parse(fs.readFileSync(p, 'utf-8'))
  draft.featuredImageAlt = alt
  fs.writeFileSync(p, JSON.stringify(draft, null, 2))
  console.log('patched:', file)
}
