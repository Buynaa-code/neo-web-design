/**
 * NEOMAP — endless-knot (4-petal Улзий). Static SVG symbol kept in DOM for
 * any component to reference via <use href="#bm-logo" />.
 */
export function BrandLogoSymbol() {
  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
      <defs>
        <symbol id="bm-logo" viewBox="0 0 240 240">
          <g fill="none" stroke="currentColor" strokeWidth="20" strokeLinecap="round" strokeLinejoin="round">
            <path d="M 115,125 C 75,105 75,55 115,28 C 118,26 122,26 125,28 C 165,55 165,105 125,125 C 122,127 118,127 115,125 Z" />
            <path d="M 115,115 C 135,75 185,75 212,115 C 214,118 214,122 212,125 C 185,165 135,165 115,125 C 113,122 113,118 115,115 Z" />
            <path d="M 125,115 C 165,135 165,185 125,212 C 122,214 118,214 115,212 C 75,185 75,135 115,115 C 118,113 122,113 125,115 Z" />
            <path d="M 125,125 C 105,165 55,165 28,125 C 26,122 26,118 28,115 C 55,75 105,75 125,115 C 127,118 127,122 125,125 Z" />
          </g>
        </symbol>
      </defs>
    </svg>
  );
}
