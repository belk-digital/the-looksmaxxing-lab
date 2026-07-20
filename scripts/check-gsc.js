const fs = require('fs');
const html = fs.readFileSync('docs/gsc-html.txt', 'utf8');

console.log("Total length:", html.length);
console.log("Contains preloader div (z-[999999]):", html.includes('z-[999999]'));
console.log("Contains AgeGate (z-[99999]):", html.includes('z-[99999]'));
console.log("Contains text 'Are you 21 years':", html.includes('Are you 21 years'));
console.log("Contains 'opacity: 0' for AgeGate:", html.includes('style="opacity: 0;"') && html.includes('Are you 21 years'));

const preloaderIndex = html.indexOf('z-[999999]');
if (preloaderIndex !== -1) {
  console.log("Preloader HTML snippet:", html.substring(preloaderIndex - 50, preloaderIndex + 100));
}

const ageGateIndex = html.indexOf('z-[99999]');
if (ageGateIndex !== -1) {
  console.log("AgeGate HTML snippet:", html.substring(ageGateIndex - 50, ageGateIndex + 100));
}
