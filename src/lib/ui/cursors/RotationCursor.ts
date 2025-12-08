export function getRotationCursor(): string {
	// Definimos un filtro de sombra para asegurar contraste sobre cualquier fondo
	// Dibujamos una elipse frontal (brillante) y una trasera (tenue)
	// Añadimos un eje vertical para referencia espacial

	const svg = `
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                <feDropShadow dx="0" dy="1" stdDeviation="2" flood-color="rgba(0,0,0,0.6)"/>
            </filter>
        </defs>
        
        <g filter="url(#glow)">
            <path d="M16 8V24" stroke="rgba(255,255,255,0.4)" stroke-width="1" stroke-dasharray="2 2"/>
            
            <path d="M28 16C28 13 22.6 10.5 16 10.5C9.4 10.5 4 13 4 16" 
                  stroke="rgba(255,255,255,0.3)" 
                  stroke-width="1.5" 
                  stroke-linecap="round"/>

            <circle cx="16" cy="16" r="2" fill="white"/>
            
            <path d="M4 16C4 19 9.4 21.5 16 21.5C22.6 21.5 28 19 28 16" 
                  stroke="white" 
                  stroke-width="2.5" 
                  stroke-linecap="round"/>
            
            <path d="M4 16L7 14M4 16L7 18.5" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M28 16L25 14M28 16L25 18.5" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </g>
    </svg>`;

	return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg.trim().replace(/\s+/g, ' '))}`;
}

export function getRotationCursorCSS(): string {
	return `url('${getRotationCursor()}') 16 16, move`;
}
