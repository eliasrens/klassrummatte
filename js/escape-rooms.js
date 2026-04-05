// js/escape-rooms.js
// SVG-rum inbäddade som strängar (undviker fetch/CORS med file://).

const EscapeRooms = (() => {
  const ROOMS = {};

  ROOMS["klassrum"] = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 700">
<!--
  KLASSRUMMET — Escape Room
  Interaktiva föremål markerade med data-obj="id"
  Klickbara ytor: <rect class="er-hitbox" .../>
-->
<defs>
  <!-- Golvmönster (parkettliknande) -->
  <pattern id="floor-pat" width="60" height="20" patternUnits="userSpaceOnUse">
    <rect width="60" height="20" fill="#c4a265"/>
    <line x1="0" y1="0" x2="0" y2="20" stroke="#b89555" stroke-width="0.5"/>
    <line x1="30" y1="10" x2="30" y2="20" stroke="#b89555" stroke-width="0.5"/>
    <line x1="0" y1="10" x2="60" y2="10" stroke="#b89555" stroke-width="0.3" opacity="0.4"/>
  </pattern>
  <!-- Kritskuggning -->
  <filter id="shadow-sm">
    <feDropShadow dx="1" dy="2" stdDeviation="2" flood-opacity="0.15"/>
  </filter>
  <filter id="shadow-md">
    <feDropShadow dx="2" dy="3" stdDeviation="4" flood-opacity="0.2"/>
  </filter>
</defs>

<!-- ═══ BAKGRUND ═══ -->
<!-- Vägg -->
<rect width="1200" height="700" fill="#f0e8d5"/>
<!-- Väggpanel (nedre halva) -->
<rect y="380" width="1200" height="320" fill="#e6dbc5"/>
<line x1="0" y1="380" x2="1200" y2="380" stroke="#d4c4a0" stroke-width="2"/>
<!-- Golv -->
<rect y="540" width="1200" height="160" fill="url(#floor-pat)"/>
<line x1="0" y1="540" x2="1200" y2="540" stroke="#a08040" stroke-width="3"/>
<!-- Takrand -->
<rect y="0" width="1200" height="8" fill="#d4c4a0"/>

<!-- ═══ FÖNSTER (bakgrund, ej klickbart) ═══ -->
<g transform="translate(520,40)">
  <rect width="160" height="200" rx="3" fill="#3a5a8c" stroke="#c4a265" stroke-width="6"/>
  <line x1="80" y1="0" x2="80" y2="200" stroke="#c4a265" stroke-width="3"/>
  <line x1="0" y1="100" x2="160" y2="100" stroke="#c4a265" stroke-width="3"/>
  <!-- Himmel + moln -->
  <rect width="160" height="200" rx="3" fill="#7db8e0" opacity="0.4"/>
  <ellipse cx="50" cy="60" rx="25" ry="12" fill="white" opacity="0.6"/>
  <ellipse cx="70" cy="55" rx="20" ry="10" fill="white" opacity="0.5"/>
  <!-- Gardin vänster -->
  <path d="M0,0 Q10,100 5,200 L-12,200 L-12,0Z" fill="#b04040" opacity="0.7"/>
  <!-- Gardin höger -->
  <path d="M160,0 Q150,100 155,200 L172,200 L172,0Z" fill="#b04040" opacity="0.7"/>
</g>

<!-- ═══ WHITEBOARD / TAVLA (klickbar) ═══ -->
<g data-obj="tavla" filter="url(#shadow-md)">
  <rect x="180" y="60" width="280" height="180" rx="4" fill="#ffffff" stroke="#888" stroke-width="3"/>
  <!-- Hyllramp -->
  <rect x="178" y="235" width="284" height="8" rx="2" fill="#888"/>
  <!-- Text-ledtråd på tavlan -->
  <text x="320" y="130" text-anchor="middle" font-size="14" fill="#4a90c4" font-family="sans-serif" opacity="0.6">Vad gömmer sig här?</text>
  <line x1="210" y1="155" x2="390" y2="155" stroke="#aaa" stroke-width="1" stroke-dasharray="4"/>
  <line x1="210" y1="175" x2="350" y2="175" stroke="#aaa" stroke-width="1" stroke-dasharray="4"/>
  <line x1="210" y1="195" x2="370" y2="195" stroke="#aaa" stroke-width="1" stroke-dasharray="4"/>
  <!-- Pennor på hyllan -->
  <rect x="200" y="228" width="4" height="12" rx="1" fill="#e04040"/>
  <rect x="208" y="229" width="4" height="11" rx="1" fill="#3070d0"/>
  <rect x="216" y="228" width="4" height="12" rx="1" fill="#30a040"/>
</g>

<!-- ═══ BOKHYLLA (klickbar) ═══ -->
<g data-obj="bokhylla" filter="url(#shadow-md)">
  <!-- Hylla kropp -->
  <rect x="30" y="120" width="120" height="310" rx="3" fill="#8B6914" stroke="#6b5010" stroke-width="2"/>
  <!-- Hyllplan -->
  <rect x="30" y="120" width="120" height="6" fill="#6b5010"/>
  <rect x="30" y="220" width="120" height="5" fill="#6b5010"/>
  <rect x="30" y="315" width="120" height="5" fill="#6b5010"/>
  <rect x="30" y="425" width="120" height="5" fill="#6b5010"/>
  <!-- Böcker rad 1 -->
  <rect x="38" y="128" width="16" height="88" rx="1" fill="#c0392b"/>
  <rect x="56" y="133" width="14" height="83" rx="1" fill="#2980b9"/>
  <rect x="72" y="130" width="18" height="86" rx="1" fill="#27ae60"/>
  <rect x="92" y="128" width="12" height="88" rx="1" fill="#8e44ad"/>
  <rect x="106" y="135" width="16" height="81" rx="1" fill="#d4a017"/>
  <rect x="124" y="130" width="14" height="86" rx="1" fill="#e67e22"/>
  <!-- Böcker rad 2 -->
  <rect x="40" y="228" width="20" height="82" rx="1" fill="#1abc9c"/>
  <rect x="62" y="232" width="14" height="78" rx="1" fill="#e74c3c"/>
  <rect x="78" y="228" width="16" height="82" rx="1" fill="#3498db"/>
  <rect x="96" y="230" width="18" height="80" rx="1" fill="#9b59b6"/>
  <rect x="116" y="228" width="16" height="82" rx="1" fill="#f39c12"/>
  <!-- Rad 3: jordglob + böcker -->
  <rect x="38" y="323" width="14" height="96" rx="1" fill="#e74c3c"/>
  <rect x="54" y="327" width="12" height="92" rx="1" fill="#2c3e50"/>
  <circle cx="110" cy="380" r="25" fill="#4a90c4" opacity="0.5" stroke="#2c6090" stroke-width="1.5"/>
  <ellipse cx="110" cy="380" rx="25" ry="10" fill="none" stroke="#2c6090" stroke-width="0.5"/>
</g>

<!-- ═══ KATEDER / LÄRARBORD (klickbar) ═══ -->
<g data-obj="kateder" filter="url(#shadow-md)">
  <!-- Bord -->
  <rect x="760" y="370" width="220" height="10" rx="2" fill="#7a5c30"/>
  <rect x="770" y="380" width="200" height="100" rx="2" fill="#8B6914" stroke="#6b5010" stroke-width="1.5"/>
  <!-- Lådfront -->
  <rect x="785" y="400" width="70" height="50" rx="2" fill="#7a5c30" stroke="#6b5010" stroke-width="1"/>
  <circle cx="820" cy="425" r="3" fill="#c4a265"/>
  <!-- Saker på bordet -->
  <rect x="880" y="355" width="40" height="15" rx="2" fill="#e8e0d0" stroke="#ccc" stroke-width="0.5"/> <!-- papper -->
  <rect x="930" y="350" width="8" height="20" rx="1" fill="#e04040"/> <!-- penna -->
  <rect x="780" y="352" width="30" height="18" rx="2" fill="#333" stroke="#555" stroke-width="1"/> <!-- dator -->
  <rect x="782" y="354" width="26" height="12" rx="1" fill="#4a90c4" opacity="0.6"/>
</g>

<!-- ═══ ELEVBÄNK FRAM (klickbar) ═══ -->
<g data-obj="bank-fram" filter="url(#shadow-sm)">
  <!-- Bordsskiva -->
  <rect x="250" y="430" width="200" height="8" rx="2" fill="#a08040"/>
  <!-- Ben -->
  <rect x="260" y="438" width="6" height="90" fill="#8a6e30"/>
  <rect x="436" y="438" width="6" height="90" fill="#8a6e30"/>
  <!-- Saker på bänken -->
  <rect x="280" y="418" width="50" height="12" rx="1" fill="#e8e0d0"/> <!-- häfte -->
  <rect x="345" y="420" width="6" height="14" rx="1" fill="#3070d0"/> <!-- penna -->
  <rect x="370" y="416" width="30" height="14" rx="2" fill="#e04040" opacity="0.7"/> <!-- sudd -->
</g>

<!-- ═══ ELEVBÄNK BAK (klickbar) ═══ -->
<g data-obj="bank-bak" filter="url(#shadow-sm)">
  <rect x="250" y="330" width="200" height="7" rx="2" fill="#a08040"/>
  <rect x="260" y="337" width="5" height="60" fill="#8a6e30"/>
  <rect x="440" y="337" width="5" height="60" fill="#8a6e30"/>
  <!-- Ryggsäck under bänken -->
  <path d="M290,370 Q290,360 300,358 L320,358 Q330,360 330,370 L330,395 Q330,400 320,400 L300,400 Q290,400 290,395Z" fill="#d04050" stroke="#a03040" stroke-width="1"/>
  <line x1="300" y1="358" x2="300" y2="350" stroke="#a03040" stroke-width="2"/>
  <line x1="320" y1="358" x2="320" y2="350" stroke="#a03040" stroke-width="2"/>
</g>

<!-- ═══ KLOCKA PÅ VÄGGEN (klickbar) ═══ -->
<g data-obj="klocka" filter="url(#shadow-sm)">
  <circle cx="870" cy="100" r="40" fill="#fff" stroke="#555" stroke-width="3"/>
  <circle cx="870" cy="100" r="36" fill="#fafafa"/>
  <!-- Siffror -->
  <text x="870" y="72" text-anchor="middle" font-size="10" fill="#333" font-family="sans-serif">12</text>
  <text x="900" y="104" text-anchor="middle" font-size="10" fill="#333" font-family="sans-serif">3</text>
  <text x="870" y="134" text-anchor="middle" font-size="10" fill="#333" font-family="sans-serif">6</text>
  <text x="840" y="104" text-anchor="middle" font-size="10" fill="#333" font-family="sans-serif">9</text>
  <!-- Visare -->
  <line x1="870" y1="100" x2="870" y2="72" stroke="#333" stroke-width="2.5" stroke-linecap="round"/>
  <line x1="870" y1="100" x2="895" y2="105" stroke="#333" stroke-width="1.5" stroke-linecap="round"/>
  <circle cx="870" cy="100" r="3" fill="#333"/>
</g>

<!-- ═══ SKÅP / GARDEROB (klickbar) ═══ -->
<g data-obj="skap" filter="url(#shadow-md)">
  <rect x="1040" y="160" width="120" height="370" rx="3" fill="#7a5c30" stroke="#5a4420" stroke-width="2"/>
  <!-- Dörrar -->
  <rect x="1046" y="168" width="52" height="354" rx="2" fill="#8B6914" stroke="#6b5010" stroke-width="1"/>
  <rect x="1102" y="168" width="52" height="354" rx="2" fill="#8B6914" stroke="#6b5010" stroke-width="1"/>
  <!-- Handtag -->
  <circle cx="1092" cy="340" r="4" fill="#c4a265" stroke="#a08040" stroke-width="1"/>
  <circle cx="1108" cy="340" r="4" fill="#c4a265" stroke="#a08040" stroke-width="1"/>
</g>

<!-- ═══ PAPPERSKORG (klickbar) ═══ -->
<g data-obj="papperskorg" filter="url(#shadow-sm)">
  <path d="M690,485 L680,535 Q680,540 686,540 L730,540 Q736,540 736,535 L726,485Z" fill="#666" stroke="#555" stroke-width="1.5"/>
  <!-- Skräp -->
  <rect x="695" y="478" width="20" height="14" rx="2" fill="#e8e0d0" transform="rotate(-15,705,485)"/>
  <rect x="700" y="482" width="18" height="10" rx="1" fill="#ddd" transform="rotate(10,709,487)"/>
</g>

<!-- ═══ AFFISCH PÅ VÄGGEN (klickbar) ═══ -->
<g data-obj="affisch" filter="url(#shadow-sm)">
  <rect x="740" y="80" width="80" height="100" rx="2" fill="#ffeaa7" stroke="#ddb347" stroke-width="1.5"/>
  <!-- "Matte"-affisch -->
  <text x="780" y="110" text-anchor="middle" font-size="11" fill="#555" font-family="sans-serif" font-weight="bold">MATTE</text>
  <text x="780" y="128" text-anchor="middle" font-size="22" fill="#e04040" font-family="sans-serif">+ - x</text>
  <text x="780" y="155" text-anchor="middle" font-size="9" fill="#777" font-family="sans-serif">Tänk logiskt!</text>
  <!-- Häftstift -->
  <circle cx="780" cy="82" r="4" fill="#e04040"/>
</g>

<!-- ═══ DÖRR (kodlåset — alltid synlig) ═══ -->
<g data-obj="dorr">
  <!-- Dörrpost -->
  <rect x="1120" y="200" width="80" height="340" rx="2" fill="#5a4420" stroke="#4a3418" stroke-width="2"/>
  <!-- Dörrpanel -->
  <rect x="1126" y="208" width="68" height="324" rx="2" fill="#7a5c30"/>
  <!-- Paneldetaljer -->
  <rect x="1134" y="220" width="52" height="80" rx="2" fill="none" stroke="#6b5010" stroke-width="1.5"/>
  <rect x="1134" y="320" width="52" height="80" rx="2" fill="none" stroke="#6b5010" stroke-width="1.5"/>
  <!-- Handtag -->
  <circle cx="1180" cy="375" r="6" fill="#c4a265" stroke="#a08040" stroke-width="2"/>
  <!-- Kodlås (liten ruta) -->
  <rect x="1145" y="420" width="30" height="25" rx="3" fill="#333" stroke="#555" stroke-width="1"/>
  <rect x="1150" y="425" width="20" height="10" rx="1" fill="#4a4" opacity="0.6"/>
  <circle cx="1160" cy="440" r="2" fill="#0f0" opacity="0.8"/>
</g>

</svg>
`;

  ROOMS["rymden"] = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 700">
<!--
  RYMDEN — Escape Room
  Mörk rymd med stjärnor, planeter och rymdskepp.
  Klickbara föremål: data-obj="id"
-->
<defs>
  <radialGradient id="nebula" cx="30%" cy="40%">
    <stop offset="0%" stop-color="#2a0845" stop-opacity="0.6"/>
    <stop offset="100%" stop-color="transparent"/>
  </radialGradient>
  <radialGradient id="planet-grad">
    <stop offset="0%" stop-color="#e8a040"/>
    <stop offset="100%" stop-color="#c06020"/>
  </radialGradient>
  <radialGradient id="earth-grad">
    <stop offset="0%" stop-color="#4a90c4"/>
    <stop offset="70%" stop-color="#2a6090"/>
    <stop offset="100%" stop-color="#1a4060"/>
  </radialGradient>
  <filter id="glow">
    <feGaussianBlur stdDeviation="3" result="blur"/>
    <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
  </filter>
  <filter id="glow-lg">
    <feGaussianBlur stdDeviation="6" result="blur"/>
    <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
  </filter>
</defs>

<!-- ═══ BAKGRUND ═══ -->
<rect width="1200" height="700" fill="#0a0a1a"/>
<rect width="1200" height="700" fill="url(#nebula)"/>

<!-- Stjärnor (bakgrund, ej klickbara) -->
<g fill="white" opacity="0.6">
  <circle cx="50" cy="30" r="1"/><circle cx="150" cy="80" r="0.8"/>
  <circle cx="300" cy="20" r="1.2"/><circle cx="420" cy="60" r="0.6"/>
  <circle cx="550" cy="40" r="1"/><circle cx="680" cy="90" r="0.8"/>
  <circle cx="800" cy="25" r="1.1"/><circle cx="950" cy="55" r="0.7"/>
  <circle cx="1100" cy="35" r="1"/><circle cx="1050" cy="100" r="0.6"/>
  <circle cx="100" cy="200" r="0.8"/><circle cx="250" cy="250" r="1"/>
  <circle cx="400" cy="180" r="0.6"/><circle cx="600" cy="300" r="0.9"/>
  <circle cx="750" cy="220" r="0.7"/><circle cx="900" cy="280" r="1"/>
  <circle cx="1000" cy="200" r="0.8"/><circle cx="1150" cy="250" r="0.6"/>
  <circle cx="80" cy="400" r="0.9"/><circle cx="200" cy="500" r="0.7"/>
  <circle cx="350" cy="450" r="1.1"/><circle cx="500" cy="550" r="0.6"/>
  <circle cx="650" cy="480" r="0.8"/><circle cx="850" cy="520" r="1"/>
  <circle cx="1000" cy="450" r="0.7"/><circle cx="1120" cy="600" r="0.9"/>
  <circle cx="180" cy="650" r="0.8"/><circle cx="450" cy="620" r="0.6"/>
  <circle cx="700" cy="660" r="1"/><circle cx="950" cy="640" r="0.7"/>
</g>

<!-- Nebulosa-moln -->
<ellipse cx="350" cy="300" rx="200" ry="120" fill="#3a1060" opacity="0.15"/>
<ellipse cx="900" cy="500" rx="180" ry="100" fill="#102050" opacity="0.2"/>

<!-- ═══ STOR PLANET (klickbar) ═══ -->
<g data-obj="planet" filter="url(#glow)">
  <circle cx="180" cy="200" r="70" fill="url(#planet-grad)"/>
  <!-- Ring -->
  <ellipse cx="180" cy="200" rx="110" ry="25" fill="none" stroke="#e8a040" stroke-width="4" opacity="0.5" transform="rotate(-15,180,200)"/>
  <!-- Kraträr -->
  <circle cx="160" cy="180" r="10" fill="#b06020" opacity="0.4"/>
  <circle cx="200" cy="220" r="7" fill="#b06020" opacity="0.3"/>
  <circle cx="175" cy="240" r="5" fill="#b06020" opacity="0.3"/>
</g>

<!-- ═══ RYMDSKEPP (klickbar) ═══ -->
<g data-obj="rymdskepp" filter="url(#glow)">
  <!-- Kropp -->
  <ellipse cx="820" cy="150" rx="70" ry="25" fill="#b0b8c0" stroke="#8090a0" stroke-width="2"/>
  <!-- Kupol -->
  <ellipse cx="820" cy="140" rx="25" ry="18" fill="#70b0e0" opacity="0.6" stroke="#8090a0" stroke-width="1"/>
  <!-- Lampor -->
  <circle cx="770" cy="155" r="4" fill="#ff4040" opacity="0.8"/>
  <circle cx="800" cy="160" r="4" fill="#40ff40" opacity="0.8"/>
  <circle cx="840" cy="160" r="4" fill="#40ff40" opacity="0.8"/>
  <circle cx="870" cy="155" r="4" fill="#ff4040" opacity="0.8"/>
  <!-- Stråle -->
  <path d="M800,170 L760,250 L880,250 L840,170Z" fill="#70b0e0" opacity="0.08"/>
</g>

<!-- ═══ METEOR (klickbar) ═══ -->
<g data-obj="meteor" filter="url(#glow)">
  <ellipse cx="550" cy="180" rx="30" ry="22" fill="#8a6040" stroke="#6a4830" stroke-width="2" transform="rotate(-20,550,180)"/>
  <!-- Kraträr -->
  <circle cx="540" cy="175" r="6" fill="#6a4830" opacity="0.5"/>
  <circle cx="560" cy="190" r="4" fill="#6a4830" opacity="0.4"/>
  <!-- Svans -->
  <path d="M575,170 Q620,155 660,165 Q640,160 620,168" fill="#ffa040" opacity="0.3"/>
</g>

<!-- ═══ JORDLIKNANDE PLANET (klickbar) ═══ -->
<g data-obj="jord" filter="url(#glow)">
  <circle cx="420" cy="450" r="55" fill="url(#earth-grad)"/>
  <!-- Kontinenter -->
  <path d="M400,420 Q415,410 430,415 Q440,420 435,435 Q425,440 410,430Z" fill="#3a8a3a" opacity="0.5"/>
  <path d="M440,440 Q455,435 460,450 Q455,465 440,460Z" fill="#3a8a3a" opacity="0.4"/>
  <!-- Moln -->
  <ellipse cx="410" cy="440" rx="20" ry="5" fill="white" opacity="0.2"/>
</g>

<!-- ═══ RYMDSTATION (klickbar) ═══ -->
<g data-obj="station" filter="url(#glow)">
  <!-- Huvudmodul -->
  <rect x="920" y="330" width="80" height="30" rx="8" fill="#b0b8c0" stroke="#8090a0" stroke-width="1.5"/>
  <!-- Solpaneler -->
  <rect x="880" y="325" width="35" height="8" fill="#304080"/>
  <rect x="880" y="337" width="35" height="8" fill="#304080"/>
  <rect x="1005" y="325" width="35" height="8" fill="#304080"/>
  <rect x="1005" y="337" width="35" height="8" fill="#304080"/>
  <!-- Kupol -->
  <circle cx="960" cy="335" r="8" fill="#70b0e0" opacity="0.5"/>
</g>

<!-- ═══ STJÄRNA (lysande, klickbar) ═══ -->
<g data-obj="stjarna" filter="url(#glow-lg)">
  <polygon points="1050,80 1058,105 1085,105 1063,120 1072,145 1050,130 1028,145 1037,120 1015,105 1042,105"
    fill="#ffe066" opacity="0.9"/>
</g>

<!-- ═══ FLAGGA PÅ MÅNEN (klickbar) ═══ -->
<g data-obj="flagga">
  <!-- Måne-yta -->
  <ellipse cx="200" cy="580" rx="140" ry="50" fill="#c8c0b0" stroke="#a8a090" stroke-width="1"/>
  <circle cx="170" cy="570" r="10" fill="#b8b0a0" opacity="0.4"/>
  <circle cx="230" cy="585" r="7" fill="#b8b0a0" opacity="0.3"/>
  <!-- Flagga -->
  <line x1="200" y1="530" x2="200" y2="575" stroke="#ccc" stroke-width="2"/>
  <rect x="202" y="532" width="35" height="22" rx="1" fill="#4a90c4"/>
  <line x1="210" y1="543" x2="230" y2="543" stroke="#ffe066" stroke-width="1.5"/>
</g>

<!-- ═══ SATELLIT (klickbar) ═══ -->
<g data-obj="satellit" filter="url(#glow)">
  <rect x="640" y="400" width="30" height="20" rx="4" fill="#b0b8c0" stroke="#8090a0" stroke-width="1"/>
  <!-- Paneler -->
  <rect x="600" y="402" width="36" height="16" fill="#304080" stroke="#203060" stroke-width="0.5"/>
  <rect x="674" y="402" width="36" height="16" fill="#304080" stroke="#203060" stroke-width="0.5"/>
  <!-- Antenn -->
  <line x1="655" y1="400" x2="655" y2="385" stroke="#ccc" stroke-width="1.5"/>
  <circle cx="655" cy="383" r="4" fill="none" stroke="#ccc" stroke-width="1"/>
</g>

<!-- ═══ PORTAL / DÖRR (kodlåset) ═══ -->
<g data-obj="dorr" filter="url(#glow-lg)">
  <ellipse cx="600" cy="600" rx="60" ry="70" fill="#2a0845" stroke="#8040c0" stroke-width="3"/>
  <ellipse cx="600" cy="600" rx="45" ry="55" fill="#3a1060" stroke="#a060e0" stroke-width="2"/>
  <ellipse cx="600" cy="600" rx="28" ry="35" fill="#5020a0" opacity="0.5"/>
  <!-- Spiraleffekt -->
  <path d="M585,580 Q600,560 615,580 Q630,600 615,620 Q600,640 585,620 Q570,600 585,580Z" fill="none" stroke="#c080ff" stroke-width="1.5" opacity="0.5"/>
  <!-- Kodpanel -->
  <rect x="585" y="610" width="30" height="20" rx="3" fill="#333" stroke="#8040c0" stroke-width="1"/>
  <circle cx="600" cy="620" r="2" fill="#0f0" opacity="0.8"/>
</g>

</svg>
`;

  ROOMS["spokslottet"] = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 700">
<!--
  SPÖKSLOTTET — Escape Room
  Mörkt, gotiskt med stenmurar, facklor och spöken.
-->
<defs>
  <pattern id="stone" width="60" height="30" patternUnits="userSpaceOnUse">
    <rect width="60" height="30" fill="#3a3040"/>
    <rect x="0" y="0" width="28" height="14" rx="1" fill="none" stroke="#2a2030" stroke-width="0.8"/>
    <rect x="30" y="0" width="30" height="14" rx="1" fill="none" stroke="#2a2030" stroke-width="0.8"/>
    <rect x="15" y="15" width="28" height="14" rx="1" fill="none" stroke="#2a2030" stroke-width="0.8"/>
    <rect x="45" y="15" width="15" height="14" rx="1" fill="none" stroke="#2a2030" stroke-width="0.8"/>
    <rect x="0" y="15" width="13" height="14" rx="1" fill="none" stroke="#2a2030" stroke-width="0.8"/>
  </pattern>
  <filter id="flicker">
    <feGaussianBlur stdDeviation="4" result="blur"/>
    <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
  </filter>
  <radialGradient id="torch-light" cx="50%" cy="80%">
    <stop offset="0%" stop-color="#ff8020" stop-opacity="0.15"/>
    <stop offset="100%" stop-color="transparent"/>
  </radialGradient>
</defs>

<!-- ═══ BAKGRUND ═══ -->
<rect width="1200" height="700" fill="url(#stone)"/>
<!-- Mörk gradient ovanpå -->
<rect width="1200" height="700" fill="url(#torch-light)" opacity="0.5"/>
<!-- Golv (mörkare sten) -->
<rect y="530" width="1200" height="170" fill="#2a2030"/>
<line x1="0" y1="530" x2="1200" y2="530" stroke="#1a1020" stroke-width="3"/>
<!-- Tak -->
<rect y="0" width="1200" height="15" fill="#1a1020"/>

<!-- Fackla ljuskälla vänster -->
<circle cx="100" cy="200" r="120" fill="#ff8020" opacity="0.04"/>
<!-- Fackla ljuskälla höger -->
<circle cx="1100" cy="200" r="120" fill="#ff8020" opacity="0.04"/>

<!-- ═══ FACKLA VÄNSTER (klickbar) ═══ -->
<g data-obj="fackla" filter="url(#flicker)">
  <rect x="88" y="200" width="8" height="60" rx="2" fill="#5a3a1a"/>
  <rect x="82" y="195" width="20" height="12" rx="2" fill="#4a2a0a"/>
  <!-- Eld -->
  <path d="M92,195 Q85,170 92,155 Q99,170 92,195Z" fill="#ff6020" opacity="0.8"/>
  <path d="M92,195 Q88,178 92,165 Q96,178 92,195Z" fill="#ffb020" opacity="0.6"/>
</g>

<!-- ═══ SPEGEL (klickbar) ═══ -->
<g data-obj="spegel">
  <!-- Ram -->
  <ellipse cx="400" cy="180" rx="55" ry="75" fill="#4a3020" stroke="#3a2010" stroke-width="4"/>
  <!-- Glas -->
  <ellipse cx="400" cy="180" rx="45" ry="65" fill="#304050" opacity="0.7"/>
  <!-- Reflektion -->
  <ellipse cx="385" cy="165" rx="15" ry="30" fill="white" opacity="0.06"/>
  <!-- Spöklik figur i spegeln -->
  <ellipse cx="400" cy="190" rx="15" ry="20" fill="white" opacity="0.08"/>
  <circle cx="394" cy="182" r="2" fill="white" opacity="0.15"/>
  <circle cx="406" cy="182" r="2" fill="white" opacity="0.15"/>
</g>

<!-- ═══ KISTA (klickbar) ═══ -->
<g data-obj="kista">
  <!-- Kropp -->
  <rect x="550" y="460" width="140" height="70" rx="3" fill="#4a3020" stroke="#3a2010" stroke-width="2"/>
  <!-- Lock (välvt) -->
  <path d="M548,460 Q620,430 692,460Z" fill="#5a3828" stroke="#3a2010" stroke-width="2"/>
  <!-- Metallband -->
  <rect x="548" y="455" width="144" height="6" fill="#6a6050"/>
  <rect x="610" y="430" width="8" height="100" rx="1" fill="#6a6050"/>
  <!-- Lås -->
  <circle cx="620" cy="480" r="8" fill="#8a7a60" stroke="#6a6050" stroke-width="2"/>
  <rect x="617" y="480" width="6" height="10" fill="#6a6050"/>
</g>

<!-- ═══ TROLLBOK (klickbar) ═══ -->
<g data-obj="trollbok">
  <rect x="230" y="400" width="70" height="50" rx="3" fill="#4a1040" stroke="#3a0830" stroke-width="2"/>
  <!-- Bokrygg -->
  <rect x="228" y="398" width="8" height="54" rx="2" fill="#3a0830"/>
  <!-- Stjärna på omslaget -->
  <polygon points="265,415 268,425 278,425 270,431 273,441 265,435 257,441 260,431 252,425 262,425"
    fill="#c8a040" opacity="0.7"/>
  <!-- Sidor -->
  <line x1="240" y1="445" x2="295" y2="445" stroke="#e8d8c0" stroke-width="0.5"/>
  <line x1="240" y1="443" x2="295" y2="443" stroke="#e8d8c0" stroke-width="0.5"/>
</g>

<!-- ═══ TROLLDRYCK (klickbar) ═══ -->
<g data-obj="trolldryck" filter="url(#flicker)">
  <!-- Flaska -->
  <rect x="840" y="380" width="6" height="20" rx="2" fill="#5a6a5a"/>
  <path d="M830,400 Q830,395 836,390 L850,390 Q856,395 856,400 L856,450 Q856,455 850,455 L836,455 Q830,455 830,450Z"
    fill="#5a6a5a" stroke="#4a5a4a" stroke-width="1"/>
  <!-- Vätska -->
  <rect x="832" y="415" width="22" height="37" rx="2" fill="#40c060" opacity="0.6"/>
  <!-- Bubblor -->
  <circle cx="840" cy="430" r="2" fill="#80ff80" opacity="0.4"/>
  <circle cx="847" cy="420" r="1.5" fill="#80ff80" opacity="0.3"/>
  <circle cx="843" cy="440" r="1" fill="#80ff80" opacity="0.3"/>
</g>

<!-- ═══ SKALLE (klickbar) ═══ -->
<g data-obj="skalle">
  <ellipse cx="700" cy="560" rx="22" ry="25" fill="#e8dcc0" stroke="#c8b8a0" stroke-width="1.5"/>
  <!-- Ögon -->
  <ellipse cx="692" cy="553" rx="6" ry="7" fill="#2a2030"/>
  <ellipse cx="708" cy="553" rx="6" ry="7" fill="#2a2030"/>
  <!-- Näsa -->
  <path d="M698,563 L700,568 L702,563Z" fill="#2a2030"/>
  <!-- Tänder -->
  <rect x="694" y="573" width="4" height="5" rx="1" fill="#e8dcc0" stroke="#c8b8a0" stroke-width="0.5"/>
  <rect x="700" y="573" width="4" height="5" rx="1" fill="#e8dcc0" stroke="#c8b8a0" stroke-width="0.5"/>
  <rect x="706" y="573" width="4" height="5" rx="1" fill="#e8dcc0" stroke="#c8b8a0" stroke-width="0.5"/>
  <!-- Käke -->
  <path d="M690,572 Q700,580 710,572" fill="none" stroke="#c8b8a0" stroke-width="1"/>
</g>

<!-- ═══ FLADDERMUS (klickbar) ═══ -->
<g data-obj="fladdermus">
  <!-- Kropp -->
  <ellipse cx="950" cy="90" rx="8" ry="12" fill="#2a2030"/>
  <!-- Vingar -->
  <path d="M942,85 Q920,60 910,80 Q918,75 930,85Z" fill="#3a3040"/>
  <path d="M958,85 Q980,60 990,80 Q982,75 970,85Z" fill="#3a3040"/>
  <!-- Ögon -->
  <circle cx="947" cy="84" r="2" fill="#ff4040" opacity="0.6"/>
  <circle cx="953" cy="84" r="2" fill="#ff4040" opacity="0.6"/>
</g>

<!-- ═══ SPINDELNÄT (klickbar) ═══ -->
<g data-obj="spindel">
  <g stroke="#aaa" stroke-width="0.5" fill="none" opacity="0.4" transform="translate(1050,100)">
    <!-- Radiella linjer -->
    <line x1="0" y1="0" x2="0" y2="-60"/>
    <line x1="0" y1="0" x2="42" y2="-42"/>
    <line x1="0" y1="0" x2="60" y2="0"/>
    <line x1="0" y1="0" x2="42" y2="42"/>
    <line x1="0" y1="0" x2="0" y2="60"/>
    <line x1="0" y1="0" x2="-42" y2="42"/>
    <line x1="0" y1="0" x2="-60" y2="0"/>
    <line x1="0" y1="0" x2="-42" y2="-42"/>
    <!-- Ringar -->
    <circle r="20"/><circle r="40"/><circle r="60"/>
  </g>
  <!-- Spindel -->
  <circle cx="1050" cy="100" r="5" fill="#2a2030"/>
  <circle cx="1050" cy="96" r="3" fill="#2a2030"/>
</g>

<!-- ═══ PORT / DÖRR (kodlåset) ═══ -->
<g data-obj="dorr">
  <!-- Stenram -->
  <rect x="10" y="180" width="100" height="350" rx="4" fill="#2a2030" stroke="#1a1020" stroke-width="3"/>
  <!-- Dörrpanel (järn) -->
  <rect x="18" y="190" width="84" height="330" rx="3" fill="#4a4040" stroke="#3a3030" stroke-width="2"/>
  <!-- Nitar -->
  <circle cx="35" cy="210" r="4" fill="#6a6050"/><circle cx="85" cy="210" r="4" fill="#6a6050"/>
  <circle cx="35" cy="500" r="4" fill="#6a6050"/><circle cx="85" cy="500" r="4" fill="#6a6050"/>
  <!-- Ring-handtag -->
  <circle cx="80" cy="360" r="12" fill="none" stroke="#8a7a60" stroke-width="3"/>
  <!-- Kodlås -->
  <rect x="40" y="410" width="35" height="28" rx="4" fill="#333" stroke="#6a6050" stroke-width="1.5"/>
  <circle cx="57" cy="430" r="2.5" fill="#0f0" opacity="0.7"/>
</g>

</svg>
`;

  ROOMS["djungeln"] = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 700">
<!--
  DJUNGELN — Escape Room
  Tropisk djungel med växter, djur och ruiner.
-->
<defs>
  <linearGradient id="sky-jungle" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="#1a5c1a"/>
    <stop offset="100%" stop-color="#0a3a0a"/>
  </linearGradient>
  <filter id="leaf-shadow">
    <feDropShadow dx="1" dy="2" stdDeviation="3" flood-opacity="0.3"/>
  </filter>
</defs>

<!-- ═══ BAKGRUND ═══ -->
<rect width="1200" height="700" fill="url(#sky-jungle)"/>
<!-- Mark -->
<rect y="520" width="1200" height="180" fill="#2d4a1a"/>
<path d="M0,520 Q200,500 400,525 Q600,540 800,515 Q1000,500 1200,525 L1200,520 L0,520Z" fill="#3a5a20"/>

<!-- Bakgrundsträd (deko) -->
<g opacity="0.3" fill="#1a4a10">
  <path d="M100,520 L70,300 Q100,250 130,300Z"/>
  <path d="M300,520 L270,280 Q300,230 330,280Z"/>
  <path d="M900,520 L870,290 Q900,240 930,290Z"/>
  <path d="M1100,520 L1070,310 Q1100,260 1130,310Z"/>
</g>
<!-- Lianer -->
<path d="M250,0 Q260,150 240,300 Q230,350 250,400" fill="none" stroke="#2a5a10" stroke-width="4" opacity="0.5"/>
<path d="M800,0 Q790,120 810,250 Q820,320 800,380" fill="none" stroke="#2a5a10" stroke-width="3" opacity="0.4"/>

<!-- ═══ APA I TRÄD (klickbar) ═══ -->
<g data-obj="apa" filter="url(#leaf-shadow)">
  <!-- Gren -->
  <path d="M170,180 Q220,170 280,190" fill="none" stroke="#5a3a1a" stroke-width="8" stroke-linecap="round"/>
  <!-- Kropp -->
  <ellipse cx="230" cy="170" rx="18" ry="22" fill="#8a5a30"/>
  <!-- Huvud -->
  <circle cx="230" cy="148" r="14" fill="#9a6a40"/>
  <circle cx="225" cy="145" r="3" fill="#2a1a0a"/>
  <circle cx="235" cy="145" r="3" fill="#2a1a0a"/>
  <ellipse cx="230" cy="153" rx="6" ry="4" fill="#c09060"/>
  <!-- Svans -->
  <path d="M245,185 Q270,200 265,170 Q260,150 270,140" fill="none" stroke="#8a5a30" stroke-width="3" stroke-linecap="round"/>
</g>

<!-- ═══ PAPEGOJA (klickbar) ═══ -->
<g data-obj="papegoja">
  <!-- Kropp -->
  <ellipse cx="750" cy="130" rx="15" ry="20" fill="#e04040"/>
  <!-- Huvud -->
  <circle cx="750" cy="108" r="12" fill="#e04040"/>
  <!-- Näbb -->
  <path d="M762,108 L772,112 L762,114Z" fill="#f0c040"/>
  <!-- Öga -->
  <circle cx="755" cy="105" r="3" fill="white"/>
  <circle cx="756" cy="105" r="1.5" fill="#1a1a1a"/>
  <!-- Vinge -->
  <path d="M740,125 Q720,140 735,155 Q740,145 745,140Z" fill="#3070d0"/>
  <!-- Stjärtfjädrar -->
  <path d="M745,150 L730,185" stroke="#e04040" stroke-width="3"/>
  <path d="M750,150 L740,188" stroke="#3070d0" stroke-width="3"/>
  <path d="M755,150 L750,185" stroke="#f0c040" stroke-width="3"/>
  <!-- Gren under -->
  <path d="M720,145 Q750,140 780,148" fill="none" stroke="#5a3a1a" stroke-width="5" stroke-linecap="round"/>
</g>

<!-- ═══ ORM PÅ MARK (klickbar) ═══ -->
<g data-obj="orm">
  <path d="M500,560 Q530,540 560,555 Q590,570 620,550 Q650,530 680,545 Q700,555 710,545"
    fill="none" stroke="#4a8a30" stroke-width="6" stroke-linecap="round"/>
  <path d="M500,560 Q530,540 560,555 Q590,570 620,550 Q650,530 680,545 Q700,555 710,545"
    fill="none" stroke="#6aaa40" stroke-width="4" stroke-linecap="round"/>
  <!-- Huvud -->
  <circle cx="710" cy="542" r="6" fill="#4a8a30"/>
  <circle cx="712" cy="540" r="1.5" fill="#ff4040"/>
  <!-- Tunga -->
  <path d="M716,543 L724,540 M716,543 L724,546" stroke="#ff4040" stroke-width="1"/>
</g>

<!-- ═══ SKATTKISTA (klickbar) ═══ -->
<g data-obj="skattkista">
  <rect x="100" y="540" width="100" height="50" rx="3" fill="#5a3a1a" stroke="#4a2a0a" stroke-width="2"/>
  <path d="M98,540 Q150,520 202,540Z" fill="#6a4a2a" stroke="#4a2a0a" stroke-width="2"/>
  <rect x="140" y="528" width="20" height="15" rx="2" fill="#c8a040" stroke="#a08020" stroke-width="1.5"/>
  <!-- Glitter -->
  <circle cx="120" cy="555" r="3" fill="#ffd700" opacity="0.5"/>
  <circle cx="170" cy="560" r="2" fill="#ffd700" opacity="0.4"/>
</g>

<!-- ═══ VATTENFALL (klickbar) ═══ -->
<g data-obj="vattenfall">
  <!-- Klippa -->
  <path d="M380,250 Q360,240 370,200 Q390,180 420,200 Q440,240 420,250Z" fill="#6a6a5a"/>
  <!-- Vatten -->
  <path d="M388,250 L385,400 Q395,410 405,400 L402,250Z" fill="#4a90c4" opacity="0.5"/>
  <path d="M390,250 L388,400 Q395,405 402,400 L400,250Z" fill="#70b8e8" opacity="0.3"/>
  <!-- Stänk -->
  <circle cx="395" cy="405" r="15" fill="#70b8e8" opacity="0.15"/>
  <!-- Sjö -->
  <ellipse cx="395" cy="420" rx="40" ry="12" fill="#4a90c4" opacity="0.3"/>
</g>

<!-- ═══ BLOMMA (klickbar) ═══ -->
<g data-obj="blomma">
  <!-- Stjälk -->
  <line x1="1000" y1="420" x2="1000" y2="520" stroke="#2a6a10" stroke-width="4"/>
  <!-- Blad -->
  <path d="M1000,470 Q980,460 970,475 Q980,480 1000,470Z" fill="#3a8a20"/>
  <!-- Kronblad -->
  <circle cx="1000" cy="410" r="12" fill="#e040a0"/>
  <circle cx="988" cy="415" r="10" fill="#d030a0"/>
  <circle cx="1012" cy="415" r="10" fill="#d030a0"/>
  <circle cx="994" cy="400" r="10" fill="#d030a0"/>
  <circle cx="1006" cy="400" r="10" fill="#d030a0"/>
  <!-- Mitt -->
  <circle cx="1000" cy="410" r="6" fill="#f0c040"/>
</g>

<!-- ═══ DIAMANT (klickbar) ═══ -->
<g data-obj="diamant">
  <polygon points="880,440 865,460 880,490 895,460" fill="#70d8f8" stroke="#50b0d0" stroke-width="1.5"/>
  <polygon points="880,440 865,460 880,465 895,460" fill="#a0e8ff" opacity="0.6"/>
  <!-- Gnista -->
  <line x1="870" y1="435" x2="867" y2="428" stroke="white" stroke-width="1" opacity="0.5"/>
  <line x1="890" y1="438" x2="894" y2="432" stroke="white" stroke-width="1" opacity="0.5"/>
</g>

<!-- ═══ STIG UT / DÖRR (kodlåset) ═══ -->
<g data-obj="dorr">
  <!-- Stenportal (ruin) -->
  <rect x="1090" y="300" width="20" height="230" fill="#6a6a5a"/>
  <rect x="1180" y="300" width="20" height="230" fill="#6a6a5a"/>
  <path d="M1090,300 Q1145,260 1200,300" fill="#6a6a5a"/>
  <!-- Öppning (ljus utanför) -->
  <rect x="1110" y="310" width="70" height="220" fill="#a0d870" opacity="0.3"/>
  <!-- Lianer runt portalen -->
  <path d="M1090,280 Q1085,350 1095,400" fill="none" stroke="#2a6a10" stroke-width="4"/>
  <path d="M1200,280 Q1205,340 1195,400" fill="none" stroke="#2a6a10" stroke-width="3"/>
  <!-- Kodlås på stenen -->
  <rect x="1125" y="470" width="40" height="30" rx="4" fill="#4a4a3a" stroke="#6a6a5a" stroke-width="1.5"/>
  <circle cx="1145" cy="490" r="3" fill="#0f0" opacity="0.7"/>
</g>

</svg>
`;

  ROOMS["undervatten"] = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 700">
<!--
  UNDERVATTEN — Escape Room
  Djuphav med koraller, vrakrester och havsdjur.
-->
<defs>
  <linearGradient id="sea-grad" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="#064273"/>
    <stop offset="60%" stop-color="#042a50"/>
    <stop offset="100%" stop-color="#021830"/>
  </linearGradient>
  <filter id="underwater">
    <feGaussianBlur stdDeviation="1.5" result="blur"/>
    <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
  </filter>
</defs>

<!-- ═══ BAKGRUND ═══ -->
<rect width="1200" height="700" fill="url(#sea-grad)"/>
<!-- Ljusstrålar uppifrån -->
<path d="M300,0 L250,700" stroke="white" stroke-width="40" opacity="0.02"/>
<path d="M600,0 L550,700" stroke="white" stroke-width="50" opacity="0.02"/>
<path d="M900,0 L870,700" stroke="white" stroke-width="35" opacity="0.02"/>
<!-- Havsbotten -->
<path d="M0,600 Q150,580 300,610 Q500,630 700,595 Q900,570 1050,605 Q1150,620 1200,600 L1200,700 L0,700Z" fill="#1a3020"/>
<!-- Sand -->
<path d="M0,620 Q200,610 400,630 Q600,645 800,620 Q1000,600 1200,625 L1200,700 L0,700Z" fill="#3a5030" opacity="0.5"/>

<!-- Bubblor (deko) -->
<g fill="white" opacity="0.15">
  <circle cx="200" cy="100" r="4"/><circle cx="210" cy="130" r="3"/>
  <circle cx="195" cy="160" r="2"/><circle cx="600" cy="200" r="5"/>
  <circle cx="610" cy="240" r="3"/><circle cx="595" cy="270" r="2"/>
  <circle cx="1000" cy="150" r="4"/><circle cx="990" cy="185" r="2.5"/>
</g>

<!-- ═══ BLÄCKFISK (klickbar) ═══ -->
<g data-obj="blackfisk" filter="url(#underwater)">
  <ellipse cx="200" cy="230" rx="40" ry="30" fill="#8040a0"/>
  <!-- Ögon -->
  <circle cx="185" cy="222" r="8" fill="white"/>
  <circle cx="215" cy="222" r="8" fill="white"/>
  <circle cx="187" cy="222" r="4" fill="#1a1a2e"/>
  <circle cx="217" cy="222" r="4" fill="#1a1a2e"/>
  <!-- Tentakler -->
  <path d="M170,255 Q150,290 165,310" fill="none" stroke="#8040a0" stroke-width="5" stroke-linecap="round"/>
  <path d="M180,260 Q165,300 175,325" fill="none" stroke="#7030a0" stroke-width="5" stroke-linecap="round"/>
  <path d="M200,265 Q195,310 205,330" fill="none" stroke="#8040a0" stroke-width="5" stroke-linecap="round"/>
  <path d="M220,260 Q235,300 225,325" fill="none" stroke="#7030a0" stroke-width="5" stroke-linecap="round"/>
  <path d="M230,255 Q250,290 235,310" fill="none" stroke="#8040a0" stroke-width="5" stroke-linecap="round"/>
</g>

<!-- ═══ KORALL (klickbar) ═══ -->
<g data-obj="korall">
  <!-- Stor korall -->
  <path d="M850,600 Q840,550 830,520 Q825,500 835,490" fill="none" stroke="#e04060" stroke-width="8" stroke-linecap="round"/>
  <path d="M850,600 Q855,540 870,510 Q880,495 875,485" fill="none" stroke="#e06080" stroke-width="7" stroke-linecap="round"/>
  <path d="M850,600 Q860,560 845,530" fill="none" stroke="#d03050" stroke-width="6" stroke-linecap="round"/>
  <!-- Liten korall -->
  <path d="M870,610 Q875,580 880,560 Q885,550 882,540" fill="none" stroke="#f0a040" stroke-width="5" stroke-linecap="round"/>
  <path d="M870,610 Q880,575 895,555" fill="none" stroke="#e09030" stroke-width="4" stroke-linecap="round"/>
</g>

<!-- ═══ SKATTKISTA (klickbar) ═══ -->
<g data-obj="skattkista">
  <rect x="500" y="590" width="120" height="55" rx="3" fill="#5a3a1a" stroke="#4a2a0a" stroke-width="2"/>
  <path d="M498,590 Q560,570 622,590Z" fill="#6a4a2a" stroke="#4a2a0a" stroke-width="2"/>
  <rect x="550" y="578" width="20" height="15" rx="2" fill="#c8a040"/>
  <!-- Guldmynt -->
  <circle cx="520" cy="605" r="5" fill="#ffd700" opacity="0.6"/>
  <circle cx="590" cy="610" r="4" fill="#ffd700" opacity="0.5"/>
  <circle cx="555" cy="608" r="3" fill="#ffd700" opacity="0.4"/>
  <!-- Sand runt kistan -->
  <ellipse cx="560" cy="645" rx="80" ry="10" fill="#3a5030" opacity="0.3"/>
</g>

<!-- ═══ FISK (klickbar) ═══ -->
<g data-obj="fisk">
  <!-- Kropp -->
  <ellipse cx="400" cy="350" rx="30" ry="15" fill="#f0a030"/>
  <!-- Stjärt -->
  <path d="M430,350 L450,335 L450,365Z" fill="#e09020"/>
  <!-- Fenor -->
  <path d="M390,340 Q385,325 400,330" fill="#d08020"/>
  <path d="M395,360 Q388,375 405,365" fill="#d08020"/>
  <!-- Öga -->
  <circle cx="380" cy="347" r="5" fill="white"/>
  <circle cx="378" cy="347" r="2.5" fill="#1a1a2e"/>
  <!-- Ränder -->
  <path d="M395,338 L395,362" stroke="#d08020" stroke-width="1.5"/>
  <path d="M405,340 L405,360" stroke="#d08020" stroke-width="1.5"/>
</g>

<!-- ═══ ANKARE (klickbar) ═══ -->
<g data-obj="ankare">
  <!-- Kedja -->
  <line x1="130" y1="0" x2="130" y2="350" stroke="#6a7a8a" stroke-width="4" stroke-dasharray="8,4"/>
  <!-- Ankare -->
  <line x1="130" y1="350" x2="130" y2="450" stroke="#5a6a7a" stroke-width="6"/>
  <path d="M90,450 Q130,480 170,450" fill="none" stroke="#5a6a7a" stroke-width="6" stroke-linecap="round"/>
  <line x1="90" y1="450" x2="90" y2="420" stroke="#5a6a7a" stroke-width="4"/>
  <line x1="170" y1="450" x2="170" y2="420" stroke="#5a6a7a" stroke-width="4"/>
  <!-- Ring -->
  <circle cx="130" cy="345" r="10" fill="none" stroke="#5a6a7a" stroke-width="4"/>
</g>

<!-- ═══ SJÖSTJÄRNA (klickbar) ═══ -->
<g data-obj="sjostjarna">
  <polygon points="680,620 685,605 698,600 685,595 680,580 675,595 662,600 675,605"
    fill="#e06040" stroke="#c04020" stroke-width="1"/>
  <!-- Prickar -->
  <circle cx="680" cy="600" r="2" fill="#f0a080" opacity="0.5"/>
  <circle cx="673" cy="596" r="1.2" fill="#f0a080" opacity="0.4"/>
  <circle cx="687" cy="604" r="1.2" fill="#f0a080" opacity="0.4"/>
</g>

<!-- ═══ KRABBA (klickbar) ═══ -->
<g data-obj="krabba">
  <ellipse cx="1000" cy="640" rx="25" ry="15" fill="#c04020"/>
  <!-- Klor -->
  <path d="M975,635 Q955,620 960,610 Q965,615 970,625" fill="#d05030" stroke="#a03018" stroke-width="1"/>
  <path d="M1025,635 Q1045,620 1040,610 Q1035,615 1030,625" fill="#d05030" stroke="#a03018" stroke-width="1"/>
  <!-- Ögon på pinnar -->
  <line x1="990" y1="628" x2="985" y2="618" stroke="#c04020" stroke-width="2"/>
  <line x1="1010" y1="628" x2="1015" y2="618" stroke="#c04020" stroke-width="2"/>
  <circle cx="985" cy="616" r="3" fill="#1a1a2e" stroke="#c04020" stroke-width="1"/>
  <circle cx="1015" cy="616" r="3" fill="#1a1a2e" stroke="#c04020" stroke-width="1"/>
</g>

<!-- ═══ PORTAL / DÖRR (kodlåset) ═══ -->
<g data-obj="dorr" filter="url(#underwater)">
  <!-- Stenportal (undervattensruin) -->
  <rect x="540" y="100" width="25" height="140" rx="3" fill="#4a6a5a" stroke="#3a5a4a" stroke-width="2"/>
  <rect x="635" y="100" width="25" height="140" rx="3" fill="#4a6a5a" stroke="#3a5a4a" stroke-width="2"/>
  <path d="M540,100 Q600,60 660,100" fill="#4a6a5a" stroke="#3a5a4a" stroke-width="2"/>
  <!-- Mystiskt ljus -->
  <rect x="565" y="110" width="70" height="125" fill="#40c0a0" opacity="0.1"/>
  <!-- Symboler -->
  <circle cx="600" cy="140" r="15" fill="none" stroke="#40c0a0" stroke-width="2" opacity="0.4"/>
  <polygon points="600,128 605,138 615,140 607,147 609,158 600,152 591,158 593,147 585,140 595,138"
    fill="#40c0a0" opacity="0.3"/>
  <!-- Kodlås -->
  <rect x="582" y="200" width="36" height="26" rx="4" fill="#333" stroke="#4a6a5a" stroke-width="1.5"/>
  <circle cx="600" cy="215" r="2.5" fill="#0f0" opacity="0.7"/>
</g>

</svg>
`;

  ROOMS["pyramiden"] = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 700">
<!--
  PYRAMIDEN — Escape Room
  Egyptisk grav med hieroglyfer, facklor och skatter.
-->
<defs>
  <pattern id="sandstone" width="40" height="20" patternUnits="userSpaceOnUse">
    <rect width="40" height="20" fill="#8a7050"/>
    <rect x="0" y="0" width="19" height="9" fill="none" stroke="#7a6040" stroke-width="0.5"/>
    <rect x="20" y="0" width="20" height="9" fill="none" stroke="#7a6040" stroke-width="0.5"/>
    <rect x="10" y="10" width="19" height="9" fill="none" stroke="#7a6040" stroke-width="0.5"/>
    <rect x="30" y="10" width="10" height="9" fill="none" stroke="#7a6040" stroke-width="0.5"/>
    <rect x="0" y="10" width="9" height="9" fill="none" stroke="#7a6040" stroke-width="0.5"/>
  </pattern>
  <filter id="torch">
    <feGaussianBlur stdDeviation="4" result="blur"/>
    <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
  </filter>
  <radialGradient id="torch-glow" cx="50%" cy="50%">
    <stop offset="0%" stop-color="#ff8020" stop-opacity="0.12"/>
    <stop offset="100%" stop-color="transparent"/>
  </radialGradient>
</defs>

<!-- ═══ BAKGRUND ═══ -->
<rect width="1200" height="700" fill="url(#sandstone)"/>
<!-- Mörkare golv -->
<rect y="530" width="1200" height="170" fill="#5a4830"/>
<line x1="0" y1="530" x2="1200" y2="530" stroke="#4a3820" stroke-width="3"/>
<!-- Tak -->
<path d="M0,0 L600,0 L600,20 L0,40Z" fill="#5a4830"/>
<path d="M1200,0 L600,0 L600,20 L1200,40Z" fill="#5a4830"/>

<!-- Fackelljus -->
<circle cx="150" cy="250" r="150" fill="url(#torch-glow)"/>
<circle cx="1050" cy="250" r="150" fill="url(#torch-glow)"/>

<!-- ═══ FACKLA VÄNSTER (klickbar) ═══ -->
<g data-obj="fackla" filter="url(#torch)">
  <rect x="135" y="250" width="10" height="80" rx="2" fill="#5a3a1a"/>
  <rect x="130" y="245" width="20" height="10" rx="2" fill="#8a6a40"/>
  <!-- Eld -->
  <path d="M140,245 Q130,215 140,195 Q150,215 140,245Z" fill="#ff6020" opacity="0.8"/>
  <path d="M140,245 Q135,222 140,208 Q145,222 140,245Z" fill="#ffb020" opacity="0.6"/>
</g>

<!-- ═══ SARKOFAG (klickbar) ═══ -->
<g data-obj="sarkofag">
  <!-- Bas -->
  <rect x="420" y="350" width="160" height="180" rx="5" fill="#c8a040" stroke="#a08020" stroke-width="2"/>
  <!-- Lock-detalj -->
  <rect x="425" y="355" width="150" height="40" rx="3" fill="#d4b050"/>
  <!-- Ansikte -->
  <ellipse cx="500" cy="420" rx="35" ry="45" fill="#d4b050" stroke="#a08020" stroke-width="1.5"/>
  <!-- Ögon -->
  <path d="M482,410 Q490,405 498,410 Q490,415 482,410Z" fill="#2a2010" stroke="#1a1005" stroke-width="0.5"/>
  <path d="M502,410 Q510,405 518,410 Q510,415 502,410Z" fill="#2a2010" stroke="#1a1005" stroke-width="0.5"/>
  <!-- Näsa -->
  <line x1="500" y1="415" x2="500" y2="430" stroke="#a08020" stroke-width="1.5"/>
  <!-- Ränder -->
  <line x1="430" y1="470" x2="570" y2="470" stroke="#a08020" stroke-width="1"/>
  <line x1="430" y1="490" x2="570" y2="490" stroke="#a08020" stroke-width="1"/>
  <line x1="430" y1="510" x2="570" y2="510" stroke="#a08020" stroke-width="1"/>
</g>

<!-- ═══ HIEROGLYF-PANEL (klickbar) ═══ -->
<g data-obj="hieroglyf">
  <rect x="650" y="100" width="120" height="180" rx="3" fill="#9a8060" stroke="#7a6040" stroke-width="2"/>
  <!-- Hieroglyfer (stiliserade) -->
  <circle cx="680" cy="135" r="10" fill="none" stroke="#5a4020" stroke-width="1.5"/>
  <circle cx="680" cy="135" r="4" fill="#5a4020"/>
  <path d="M715,125 L740,125 L727,145Z" fill="none" stroke="#5a4020" stroke-width="1.5"/>
  <path d="M670,165 Q690,155 710,165 Q690,175 670,165Z" fill="none" stroke="#5a4020" stroke-width="1.5"/>
  <rect x="720" y="158" width="20" height="15" rx="1" fill="none" stroke="#5a4020" stroke-width="1.5"/>
  <path d="M680,200 L680,230 M670,210 L690,210" stroke="#5a4020" stroke-width="2"/>
  <path d="M720,195 Q730,205 720,220 Q740,210 720,195Z" fill="none" stroke="#5a4020" stroke-width="1.5"/>
  <circle cx="700" cy="255" r="12" fill="none" stroke="#5a4020" stroke-width="1.5"/>
  <path d="M694,250 L700,245 L706,250 M694,258 L700,263 L706,258" stroke="#5a4020" stroke-width="1"/>
</g>

<!-- ═══ SKARABÉ (klickbar) ═══ -->
<g data-obj="skarabe">
  <ellipse cx="300" cy="480" rx="20" ry="15" fill="#2a6040" stroke="#1a4030" stroke-width="1.5"/>
  <!-- Huvud -->
  <circle cx="300" cy="462" r="8" fill="#2a6040" stroke="#1a4030" stroke-width="1"/>
  <!-- Vingar -->
  <path d="M280,478 Q260,470 255,485 Q265,490 280,478Z" fill="#3a7050" stroke="#1a4030" stroke-width="0.5"/>
  <path d="M320,478 Q340,470 345,485 Q335,490 320,478Z" fill="#3a7050" stroke="#1a4030" stroke-width="0.5"/>
  <!-- Detalj -->
  <line x1="290" y1="475" x2="290" y2="490" stroke="#1a4030" stroke-width="0.8"/>
  <line x1="300" y1="472" x2="300" y2="495" stroke="#1a4030" stroke-width="0.8"/>
  <line x1="310" y1="475" x2="310" y2="490" stroke="#1a4030" stroke-width="0.8"/>
</g>

<!-- ═══ GULDMASK (klickbar) ═══ -->
<g data-obj="mask">
  <ellipse cx="870" cy="180" rx="40" ry="55" fill="#d4a020" stroke="#b08010" stroke-width="2"/>
  <!-- Huvudduk -->
  <path d="M830,175 Q870,120 910,175" fill="#1a4080" stroke="#103060" stroke-width="1.5"/>
  <!-- Ögon -->
  <path d="M850,175 Q860,168 870,175 Q860,180 850,175Z" fill="#1a1a2e" stroke="#b08010" stroke-width="1"/>
  <path d="M870,175 Q880,168 890,175 Q880,180 870,175Z" fill="#1a1a2e" stroke="#b08010" stroke-width="1"/>
  <!-- Näsa -->
  <line x1="870" y1="180" x2="870" y2="195" stroke="#b08010" stroke-width="1.5"/>
  <!-- Mun -->
  <path d="M855,205 Q870,215 885,205" fill="none" stroke="#b08010" stroke-width="1.5"/>
  <!-- Ränder på huvudduk -->
  <line x1="835" y1="160" x2="840" y2="230" stroke="#d4a020" stroke-width="1" opacity="0.5"/>
  <line x1="905" y1="160" x2="900" y2="230" stroke="#d4a020" stroke-width="1" opacity="0.5"/>
</g>

<!-- ═══ GULDMYNT (klickbar) ═══ -->
<g data-obj="guldmynt">
  <circle cx="750" cy="560" r="18" fill="#d4a020" stroke="#b08010" stroke-width="2"/>
  <circle cx="750" cy="560" r="13" fill="none" stroke="#b08010" stroke-width="1"/>
  <!-- Symbol -->
  <path d="M745,552 L750,548 L755,552 M745,568 L750,572 L755,568 M750,548 L750,572" stroke="#b08010" stroke-width="1.5" fill="none"/>
  <!-- Extra mynt -->
  <circle cx="730" cy="575" r="10" fill="#c89818" stroke="#a07810" stroke-width="1.5" opacity="0.6"/>
  <circle cx="770" cy="572" r="8" fill="#c89818" stroke="#a07810" stroke-width="1" opacity="0.4"/>
</g>

<!-- ═══ KOBRA (klickbar) ═══ -->
<g data-obj="kobra">
  <path d="M1000,530 Q1000,480 1010,440 Q1015,420 1010,400" fill="none" stroke="#6a8a30" stroke-width="8" stroke-linecap="round"/>
  <!-- Huva -->
  <ellipse cx="1010" cy="395" rx="18" ry="12" fill="#6a8a30"/>
  <!-- Huvud -->
  <ellipse cx="1010" cy="385" rx="10" ry="10" fill="#7a9a40"/>
  <!-- Ögon -->
  <circle cx="1005" cy="382" r="2.5" fill="#ff4040" opacity="0.7"/>
  <circle cx="1015" cy="382" r="2.5" fill="#ff4040" opacity="0.7"/>
  <!-- Tunga -->
  <path d="M1010,393 L1010,402 M1007,402 L1010,398 L1013,402" stroke="#ff4040" stroke-width="1"/>
</g>

<!-- ═══ DÖRR / UTGÅNG (kodlåset) ═══ -->
<g data-obj="dorr">
  <!-- Stenram -->
  <rect x="20" y="150" width="100" height="380" rx="4" fill="#6a5838" stroke="#5a4828" stroke-width="3"/>
  <!-- Panel -->
  <rect x="30" y="160" width="80" height="360" rx="3" fill="#7a6848"/>
  <!-- Hieroglyf-ram runt dörren -->
  <rect x="25" y="155" width="90" height="370" rx="3" fill="none" stroke="#c8a040" stroke-width="1.5"/>
  <!-- Symbol ovanför -->
  <polygon points="70,130 55,155 85,155" fill="#c8a040" opacity="0.6"/>
  <circle cx="70" cy="145" r="5" fill="#c8a040" opacity="0.4"/>
  <!-- Kodlås -->
  <rect x="48" y="420" width="36" height="28" rx="4" fill="#333" stroke="#c8a040" stroke-width="1.5"/>
  <circle cx="66" cy="438" r="2.5" fill="#0f0" opacity="0.7"/>
</g>

</svg>
`;

  return { get: id => ROOMS[id] || null };
})();
