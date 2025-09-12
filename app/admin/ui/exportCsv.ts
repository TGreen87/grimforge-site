export function exportCsv(filename: string, rows: Record<string, any>[]) {
  if (!rows || rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const csv = [headers.join(',')]
    .concat(rows.map(r => headers.map(h => csvCell(r[h])).join(',')))
    .join('\n');
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function csvCell(v: any): string {
  if (v == null) return '';
  const s = String(v).replace(/"/g, '""');
  if (s.includes(',') || s.includes('\n') || s.includes('"')) return '"' + s + '"';
  return s;
}
