@serif:"Times New Roman Regular","FreeSerif Medium","DejaVu Serif Book";
@serif_italic:"Times New Roman Italic","FreeSerif Italic","DejaVu Serif Italic";
@sans:"Arial Regular","Liberation Sans Regular","DejaVu Sans Book";
@sans-bold:"Arial Bold","Liberation Sans Bold","DejaVu Sans Bold";

#country_label[zoom>2][zoom<6][ADM0_A3='CAN'],
#country_label[zoom>2][zoom<6][ADM0_A3='USA'],
#country_label[zoom>2][zoom<6][ADM0_A3='MEX'] {
  text-name:"[NAME]";
  text-face-name:@serif;
  text-transform:uppercase;
  text-character-spacing:1;
  text-line-spacing:4;
  text-size:14;
  text-wrap-width:120;
  text-allow-overlap:true;
  text-halo-radius:2;
  text-halo-fill:rgba(255,255,255,0.75);
}

#city[SOV_A3='USA'][SCALERANK<4][zoom>2],
#city[SOV_A3='USA'][SCALERANK=4][zoom>3],
#city[SOV_A3='USA'][SCALERANK=5][zoom>4],
#city[SOV_A3='USA'][SCALERANK>=6][zoom>5] {
  text-name:"[NAME]";
  text-face-name:@sans-bold;
  text-size:9;
  text-halo-radius:1;
  text-halo-fill:rgba(255,255,255,0.75);
}

#park_label[zoom>5] {
  text-name:"[Unit_Name]";
  text-face-name:@serif_italic;
  text-fill:#063;
  text-size:11;
  text-halo-radius:1;
  text-halo-fill:rgba(255,255,255,0.75);
  text-wrap-width:30;
  text-line-spacing:2;
}

#geo-region {
  text-name:"[Name]";
  text-face-name:@serif_italic;
  text-fill:#036;
  text-size:11;
  text-halo-radius:1;
  text-halo-fill:rgba(255,255,255,0.75);
  text-wrap-width:30;
  text-line-spacing:2;
}
