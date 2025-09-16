import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Size Guide',
  description: 'Measurements for apparel and accessories sold by Obsidian Rite Records.',
}

const sizingTable = [
  { size: 'S', chest: '48 cm', length: '71 cm' },
  { size: 'M', chest: '53 cm', length: '74 cm' },
  { size: 'L', chest: '58 cm', length: '77 cm' },
  { size: 'XL', chest: '63 cm', length: '79 cm' },
  { size: '2XL', chest: '68 cm', length: '81 cm' },
]

export default function SizeGuidePage() {
  return (
    <article className="space-y-6 text-muted-foreground">
      <header className="space-y-2">
        <h1 className="blackletter text-4xl text-bone">Size Guide</h1>
        <p>Garments are printed on AS Colour blanks unless otherwise stated. Measurements below are taken with the tee laid flat.</p>
      </header>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-bone">
            <tr>
              <th className="py-2">Size</th>
              <th className="py-2">Chest (pit-to-pit)</th>
              <th className="py-2">Length</th>
            </tr>
          </thead>
          <tbody>
            {sizingTable.map((row) => (
              <tr key={row.size} className="border-t border-border">
                <td className="py-2">{row.size}</td>
                <td className="py-2">{row.chest}</td>
                <td className="py-2">{row.length}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-sm">Need help choosing? Drop us a line with your usual size and we’ll compare it to current stock.</p>
    </article>
  )
}

