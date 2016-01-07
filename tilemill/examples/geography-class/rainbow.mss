/***********************************************************************

This file is responsible for assigning colors to each country. Color
assignment is mostly manual. Not taking advantage of Natural Earth's
'MAP_COLOR' field because it did not exist when I started, and at any
rate I want a smaller palette :)

***********************************************************************/

@white: #F0F8FF; /* blue-tinted, for Antarctica */
@red: #fdaf6b;
@orange: #fdc663;
@yellow: #fae364;
@green: #d3e46f;
@turquoise: #aadb78;
@blue: #a3cec5;
@purple: #ceb5cf;
@pink: #f3c1d3;
@f00: #f00;

/* Coastlines */
#country::land-glow-inner[zoom>=0] { 
  line-color:@line;
  line-opacity:0.8;
  line-join:round;
  [zoom=0] { line-width:1.2; }
  [zoom=1] { line-width:1.6; }
  [zoom=2] { line-width:2; }
  [zoom>2] { line-width:2.4; }
}

#country::land-glow-outer[zoom>1] { 
  line-color:@line;
  line-width:5;
  line-opacity:0.1;
  line-join:round;
}

#country::fill[zoom>=0] {
  [ADM0_A3='ABW'] { polygon-fill:@purple; }
  [ADM0_A3='AFG'] { polygon-fill:@red; }
  [ADM0_A3='AGO'] { polygon-fill:@yellow; }
  [ADM0_A3='AIA'] { polygon-fill:@blue; }
  [ADM0_A3='ALB'] { polygon-fill:@purple; }
  [ADM0_A3='ALD'] { polygon-fill:@red; }
  [ADM0_A3='AND'] { polygon-fill:@purple; }
  [ADM0_A3='ARE'] { polygon-fill:@green; }
  [ADM0_A3='ARG'] { polygon-fill:@green; }
  [ADM0_A3='ARM'] { polygon-fill:@pink; }
  [ADM0_A3='ASM'] { polygon-fill:@yellow; }
  [ADM0_A3='ATA'] { polygon-fill:@white; }
  [ADM0_A3='ATC'] { polygon-fill:@purple; }
  [ADM0_A3='ATF'] { polygon-fill:@yellow; }
  [ADM0_A3='ATG'] { polygon-fill:@pink; }
  [ADM0_A3='AUS'] { polygon-fill:@pink; }
  [ADM0_A3='AUT'] { polygon-fill:@turquoise; }
  [ADM0_A3='AZE'] { polygon-fill:@orange; }
  [ADM0_A3='BDI'] { polygon-fill:@yellow; }
  [ADM0_A3='BEL'] { polygon-fill:@turquoise; }
  [ADM0_A3='BEN'] { polygon-fill:@red; }
  [ADM0_A3='BFA'] { polygon-fill:@yellow; }
  [ADM0_A3='BGD'] { polygon-fill:@orange; }
  [ADM0_A3='BGR'] { polygon-fill:@yellow; }
  [ADM0_A3='BHR'] { polygon-fill:@turquoise; }
  [ADM0_A3='BHS'] { polygon-fill:@green; }
  [ADM0_A3='BIH'] { polygon-fill:@blue; }
  [ADM0_A3='BLM'] { polygon-fill:@blue; }
  [ADM0_A3='BLR'] { polygon-fill:@red; }
  [ADM0_A3='BLZ'] { polygon-fill:@yellow; }
  [ADM0_A3='BMU'] { polygon-fill:@turquoise; }
  [ADM0_A3='BOL'] { polygon-fill:@purple; }
  [ADM0_A3='BRA'] { polygon-fill:@yellow; }
  [ADM0_A3='BRB'] { polygon-fill:@turquoise; }
  [ADM0_A3='BRN'] { polygon-fill:@blue; }
  [ADM0_A3='BTN'] { polygon-fill:@pink; }
  [ADM0_A3='BWA'] { polygon-fill:@red; }
  [ADM0_A3='CAF'] { polygon-fill:@blue; }
  [ADM0_A3='CAN'] { polygon-fill:@pink; }
  [ADM0_A3='CHE'] { polygon-fill:@blue; }
  [ADM0_A3='CHL'] { polygon-fill:@orange; }
  [ADM0_A3='CHN'] { polygon-fill:@yellow; }
  [ADM0_A3='CIV'] { polygon-fill:@green; }
  [ADM0_A3='CLP'] { polygon-fill:@green; }
  [ADM0_A3='CMR'] { polygon-fill:@orange; }
  [ADM0_A3='CNM'] { polygon-fill:#fff; }
  [ADM0_A3='COD'] { polygon-fill:@purple; }
  [ADM0_A3='COG'] { polygon-fill:@pink; }
  [ADM0_A3='COK'] { polygon-fill:@red; }
  [ADM0_A3='COL'] { polygon-fill:@red; }
  [ADM0_A3='COM'] { polygon-fill:@blue; }
  [ADM0_A3='CPV'] { polygon-fill:@blue; }
  [ADM0_A3='CRI'] { polygon-fill:@yellow; }
  [ADM0_A3='CSI'] { polygon-fill:@orange; }
  [ADM0_A3='CUB'] { polygon-fill:@blue; }
  [ADM0_A3='CUW'] { polygon-fill:@purple; }
  [ADM0_A3='CYM'] { polygon-fill:@purple; }
  [ADM0_A3='CYN'] { polygon-fill:@turquoise; }
  [ADM0_A3='CYP'] { polygon-fill:@purple; }
  [ADM0_A3='CZE'] { polygon-fill:@pink; }
  [ADM0_A3='DEU'] { polygon-fill:@orange; }
  [ADM0_A3='DJI'] { polygon-fill:@orange; }
  [ADM0_A3='DMA'] { polygon-fill:@green; }
  [ADM0_A3='DNK'] { polygon-fill:@red; }
  [ADM0_A3='DOM'] { polygon-fill:@red; }
  [ADM0_A3='DZA'] { polygon-fill:@turquoise; }
  [ADM0_A3='ECU'] { polygon-fill:@blue; }
  [ADM0_A3='EGY'] { polygon-fill:@purple; }
  [ADM0_A3='ERI'] { polygon-fill:@red; }
  [ADM0_A3='ESB'] { polygon-fill:@blue; }
  [ADM0_A3='ESP'] { polygon-fill:@yellow; }
  [ADM0_A3='EST'] { polygon-fill:@turquoise; }
  [ADM0_A3='ETH'] { polygon-fill:@green; }
  [ADM0_A3='FIN'] { polygon-fill:@red; }
  [ADM0_A3='FJI'] { polygon-fill:@purple; }
  [ADM0_A3='FLK'] { polygon-fill:@turquoise; }
  [ADM0_A3='FRA'] { polygon-fill:@red; }
  [ADM0_A3='FRO'] { polygon-fill:@red; }
  [ADM0_A3='FSM'] { polygon-fill:@blue; }
  [ADM0_A3='GAB'] { polygon-fill:@green; }
  [ADM0_A3='GAZ'] { polygon-fill:@blue; }
  [ADM0_A3='GBR'] { polygon-fill:@blue; }
  [ADM0_A3='GEO'] { polygon-fill:@blue; }
  [ADM0_A3='GGY'] { polygon-fill:@purple; }
  [ADM0_A3='GHA'] { polygon-fill:@pink; }
  [ADM0_A3='GIB'] { polygon-fill:@red; }
  [ADM0_A3='GIN'] { polygon-fill:@pink; }
  [ADM0_A3='GMB'] { polygon-fill:@turquoise; }
  [ADM0_A3='GNB'] { polygon-fill:@red; }
  [ADM0_A3='GNQ'] { polygon-fill:@red; }
  [ADM0_A3='GRC'] { polygon-fill:@red; }
  [ADM0_A3='GRD'] { polygon-fill:@green; }
  [ADM0_A3='GRL'] { polygon-fill:@green; }
  [ADM0_A3='GTM'] { polygon-fill:@red; }
  [ADM0_A3='GUM'] { polygon-fill:@turquoise; }
  [ADM0_A3='GUY'] { polygon-fill:@orange; }
  [ADM0_A3='HKG'] { polygon-fill:@yellow; }
  [ADM0_A3='HMD'] { polygon-fill:@green; }
  [ADM0_A3='HND'] { polygon-fill:@turquoise; }
  [ADM0_A3='HRV'] { polygon-fill:@yellow; }
  [ADM0_A3='HTI'] { polygon-fill:@pink; }
  [ADM0_A3='HUN'] { polygon-fill:@orange; }
  [ADM0_A3='IDN'] { polygon-fill:@yellow; }
  [ADM0_A3='IMN'] { polygon-fill:@purple; }
  [ADM0_A3='IND'] { polygon-fill:@green; }
  [ADM0_A3='IOA'] { polygon-fill:@orange; }
  [ADM0_A3='IOT'] { polygon-fill:@green; }
  [ADM0_A3='IRL'] { polygon-fill:@green; }
  [ADM0_A3='IRN'] { polygon-fill:@yellow; }
  [ADM0_A3='IRQ'] { polygon-fill:@green; }
  [ADM0_A3='ISL'] { polygon-fill:@pink; }
  [ADM0_A3='ISR'] { polygon-fill:@yellow; }
  [ADM0_A3='ITA'] { polygon-fill:@green; }
  [ADM0_A3='JAM'] { polygon-fill:@orange; }
  [ADM0_A3='JEY'] { polygon-fill:@turquoise; }
  [ADM0_A3='JOR'] { polygon-fill:@pink; }
  [ADM0_A3='JPN'] { polygon-fill:@red; }
  [ADM0_A3='KAB'] { polygon-fill:@purple; }
  [ADM0_A3='KAS'] { polygon-fill:#fff; }
  [ADM0_A3='KAZ'] { polygon-fill:@purple; }
  [ADM0_A3='KEN'] { polygon-fill:@blue; }
  [ADM0_A3='KGZ'] { polygon-fill:@turquoise; }
  [ADM0_A3='KHM'] { polygon-fill:@pink; }
  [ADM0_A3='KIR'] { polygon-fill:@red; }
  [ADM0_A3='KNA'] { polygon-fill:@yellow; }
  [ADM0_A3='KNM'] { polygon-fill:#fff; }
  [ADM0_A3='KOR'] { polygon-fill:@pink; }
  [ADM0_A3='KOS'] { polygon-fill:@green; }
  [ADM0_A3='KWT'] { polygon-fill:@purple; }
  [ADM0_A3='LAO'] { polygon-fill:@purple; }
  [ADM0_A3='LBN'] { polygon-fill:@orange; }
  [ADM0_A3='LBR'] { polygon-fill:@yellow; }
  [ADM0_A3='LBY'] { polygon-fill:@orange; }
  [ADM0_A3='LCA'] { polygon-fill:@yellow; }
  [ADM0_A3='LIE'] { polygon-fill:@turquoise; }
  [ADM0_A3='LKA'] { polygon-fill:@red; }
  [ADM0_A3='LSO'] { polygon-fill:@orange; }
  [ADM0_A3='LTU'] { polygon-fill:@blue; }
  [ADM0_A3='LUX'] { polygon-fill:@green; }
  [ADM0_A3='LVA'] { polygon-fill:@pink; }
  [ADM0_A3='MAC'] { polygon-fill:@yellow; }
  [ADM0_A3='MAF'] { polygon-fill:@turquoise; }
  [ADM0_A3='MAR'] { polygon-fill:@blue; }
  [ADM0_A3='MCO'] { polygon-fill:@blue; }
  [ADM0_A3='MDA'] { polygon-fill:@turquoise; }
  [ADM0_A3='MDG'] { polygon-fill:@orange; }
  [ADM0_A3='MDV'] { polygon-fill:@blue; }
  [ADM0_A3='MEX'] { polygon-fill:@green; }
  [ADM0_A3='MHL'] { polygon-fill:@red; }
  [ADM0_A3='MKD'] { polygon-fill:@orange; }
  [ADM0_A3='MLI'] { polygon-fill:@purple; }
  [ADM0_A3='MLT'] { polygon-fill:@pink; }
  [ADM0_A3='MMR'] { polygon-fill:@red; }
  [ADM0_A3='MNE'] { polygon-fill:@pink; }
  [ADM0_A3='MNG'] { polygon-fill:@orange; }
  [ADM0_A3='MNP'] { polygon-fill:@purple; }
  [ADM0_A3='MOZ'] { polygon-fill:@pink; }
  [ADM0_A3='MRT'] { polygon-fill:@orange; }
  [ADM0_A3='MSR'] { polygon-fill:@purple; }
  [ADM0_A3='MUS'] { polygon-fill:@yellow; }
  [ADM0_A3='MWI'] { polygon-fill:@red; }
  [ADM0_A3='MYS'] { polygon-fill:@purple; }
  [ADM0_A3='NAM'] { polygon-fill:@green; }
  [ADM0_A3='NCL'] { polygon-fill:@red; }
  [ADM0_A3='NER'] { polygon-fill:@green; }
  [ADM0_A3='NFK'] { polygon-fill:@blue; }
  [ADM0_A3='NGA'] { polygon-fill:@turquoise; }
  [ADM0_A3='NIC'] { polygon-fill:@purple; }
  [ADM0_A3='NIU'] { polygon-fill:@orange; }
  [ADM0_A3='NLD'] { polygon-fill:@purple; }
  [ADM0_A3='NOR'] { polygon-fill:@yellow; }
  [ADM0_A3='NPL'] { polygon-fill:@blue; }
  [ADM0_A3='NRU'] { polygon-fill:@turquoise; }
  [ADM0_A3='NZL'] { polygon-fill:@orange; }
  [ADM0_A3='OMN'] { polygon-fill:@red; }
  [ADM0_A3='PAK'] { polygon-fill:@purple; }
  [ADM0_A3='PAN'] { polygon-fill:@green; }
  [ADM0_A3='PCN'] { polygon-fill:@orange; }
  [ADM0_A3='PER'] { polygon-fill:@pink; }
  [ADM0_A3='PHL'] { polygon-fill:@green; }
  [ADM0_A3='PLW'] { polygon-fill:@yellow; }
  [ADM0_A3='PNG'] { polygon-fill:@blue; }
  [ADM0_A3='POL'] { polygon-fill:@yellow; }
  [ADM0_A3='PRI'] { polygon-fill:@yellow; }
  [ADM0_A3='PRK'] { polygon-fill:@purple; }
  [ADM0_A3='PRT'] { polygon-fill:@green; }
  [ADM0_A3='PRY'] { polygon-fill:@blue; }
  [ADM0_A3='PYF'] { polygon-fill:@orange; }
  [ADM0_A3='QAT'] { polygon-fill:@blue; }
  [ADM0_A3='ROU'] { polygon-fill:@purple; }
  [ADM0_A3='RUS'] { polygon-fill:@green; }
  [ADM0_A3='RWA'] { polygon-fill:@red; }
  [ADM0_A3='SAH'] { polygon-fill:@pink; }
  [ADM0_A3='SAU'] { polygon-fill:@orange; }
  [ADM0_A3='SDN'] { polygon-fill:@yellow; }
  [ADM0_A3='SDS'] { polygon-fill:@red; }
  [ADM0_A3='SEN'] { polygon-fill:@green; }
  [ADM0_A3='SGP'] { polygon-fill:@pink; }
  [ADM0_A3='SGS'] { polygon-fill:@purple; }
  [ADM0_A3='SHN'] { polygon-fill:@orange; }
  [ADM0_A3='SLB'] { polygon-fill:@turquoise; }
  [ADM0_A3='SLE'] { polygon-fill:@blue; }
  [ADM0_A3='SLV'] { polygon-fill:@pink; }
  [ADM0_A3='SMR'] { polygon-fill:@red; }
  [ADM0_A3='SOL'] { polygon-fill:@turquoise; }
  [ADM0_A3='SOM'] { polygon-fill:@pink; }
  [ADM0_A3='SPM'] { polygon-fill:@blue; }
  [ADM0_A3='SRB'] { polygon-fill:@turquoise; }
  [ADM0_A3='STP'] { polygon-fill:@orange; }
  [ADM0_A3='SUR'] { polygon-fill:@green; }
  [ADM0_A3='SVK'] { polygon-fill:@red; }
  [ADM0_A3='SVN'] { polygon-fill:@purple; }
  [ADM0_A3='SWE'] { polygon-fill:@purple; }
  [ADM0_A3='SWZ'] { polygon-fill:@turquoise; }
  [ADM0_A3='SYC'] { polygon-fill:@blue; }
  [ADM0_A3='SYR'] { polygon-fill:@red; }
  [ADM0_A3='TCA'] { polygon-fill:@blue; }
  [ADM0_A3='TCD'] { polygon-fill:@red; }
  [ADM0_A3='TGO'] { polygon-fill:@purple; }
  [ADM0_A3='THA'] { polygon-fill:@turquoise; }
  [ADM0_A3='TJK'] { polygon-fill:@pink; }
  [ADM0_A3='TKM'] { polygon-fill:@blue; }
  [ADM0_A3='TLS'] { polygon-fill:@blue; }
  [ADM0_A3='TON'] { polygon-fill:@red; }
  [ADM0_A3='TTO'] { polygon-fill:@orange; }
  [ADM0_A3='TUN'] { polygon-fill:@yellow; }
  [ADM0_A3='TUR'] { polygon-fill:@turquoise; }
  [ADM0_A3='TUV'] { polygon-fill:@pink; }
  [ADM0_A3='TWN'] { polygon-fill:@purple; }
  [ADM0_A3='TZA'] { polygon-fill:@green; }
  [ADM0_A3='UGA'] { polygon-fill:@orange; }
  [ADM0_A3='UKR'] { polygon-fill:@pink; }
  [ADM0_A3='UMI'] { polygon-fill:@yellow; }
  [ADM0_A3='URY'] { polygon-fill:@red; }
  [ADM0_A3='USA'] { polygon-fill:@yellow; }
  [ADM0_A3='USG'] { polygon-fill:@yellow; }
  [ADM0_A3='UZB'] { polygon-fill:@orange; }
  [ADM0_A3='VAT'] { polygon-fill:@green; }
  [ADM0_A3='VCT'] { polygon-fill:@purple; }
  [ADM0_A3='VEN'] { polygon-fill:@turquoise; }
  [ADM0_A3='VGB'] { polygon-fill:@turquoise; }
  [ADM0_A3='VIR'] { polygon-fill:@yellow; }
  [ADM0_A3='VNM'] { polygon-fill:@blue; }
  [ADM0_A3='VUT'] { polygon-fill:@yellow; }
  [ADM0_A3='WEB'] { polygon-fill:@blue; }
  [ADM0_A3='WLF'] { polygon-fill:@red; }
  [ADM0_A3='WSB'] { polygon-fill:@blue; }
  [ADM0_A3='WSM'] { polygon-fill:@pink; }
  [ADM0_A3='YEM'] { polygon-fill:@blue; }
  [ADM0_A3='ZAF'] { polygon-fill:@purple; }
  [ADM0_A3='ZMB'] { polygon-fill:@orange; }
  [ADM0_A3='ZWE'] { polygon-fill:@blue; }
}
