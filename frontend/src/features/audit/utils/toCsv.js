// CSV da auditoria (regra AU6), gerado no navegador.
// Separador ";" e BOM, para o Excel em pt-BR abrir com acentos e colunas certas.

// Célula que começa com = + - @ (ou tab/enter) vira fórmula no Excel: um título de
// projeto como "=HYPERLINK(...)" poderia virar link malicioso. Prefixar com '
// mantém o texto e impede a fórmula
const BOM = String.fromCharCode(0xfeff)

const FORMULA_START = /^[=+\-@\t\r]/

export function csvCell(value) {
  const text = value === null || value === undefined ? '' : String(value)
  const safe = FORMULA_START.test(text) ? `'${text}` : text

  return /[";\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe
}

export function toCsv(header, rows) {
  return `${BOM}${[header, ...rows].map((row) => row.map(csvCell).join(';')).join('\r\n')}`
}
