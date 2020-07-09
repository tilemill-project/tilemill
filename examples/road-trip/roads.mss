#road::l[Type='Major Highway'][zoom>2],
#road::l[Type='Secondary Highway'][zoom>2] {
  line-color:#C33;
}
/*#road[SOV_A3='USA'][Type='Major Highway'][zoom>1],
#road[SOV_A3='USA'][Type='Secondary Highway'][zoom>1] {
  line-color:#F00;
}*/

/* Roads - Z3 */
#road::l[Type='Major Highway'][zoom=3] { line-width:0.5; }
#road::l[Type='Secondary Highway'][zoom=3] { line-width:0.2; }
/* Roads - Z4 */
#road::l[Type='Major Highway'][zoom=4] { line-width:0.6; }
#road::l[Type='Secondary Highway'][zoom=4] { line-width:0.3; }
/* Roads - Z5 */
#road::l[Type='Major Highway'][zoom=5] { line-width:1.2; }
#road::l[Type='Secondary Highway'][zoom=5] { line-width:0.6; }
/* Roads - Z6 */
#road::l[Type='Major Highway'][zoom=6] { line-width:2; }
#road::l[Type='Secondary Highway'][zoom=6] { line-width:0.8; }
/* Roads - Z7 */
#road::l[Type='Major Highway'][zoom=7] { line-width:2.6; }
#road::l[Type='Secondary Highway'][zoom=7] { line-width:1.3; }

#road_na[zoom>5][TYPE='Primary'] {
  line-color:#E63;
  line-width:0.8;
}

/* Railroads */
#rail[zoom>4] {
  line-color:#999;
  line-width:0.6;
}