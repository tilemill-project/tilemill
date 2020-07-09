#include <stdio.h>
#include <math.h>
#include <stdlib.h>

#define EARTH_RADIUS       (6371.0072 * 0.6214)
#define TORADS(degrees)    (degrees * (M_PI / 180))

main(int argc, char **argv)
{
   double lat1, long1, lat2, long2;
   double dLat, dLong, a, c, d;

   lat1  = TORADS(atof(argv[1]));
   long1 = TORADS(atof(argv[2]));
   lat2  = TORADS(atof(argv[3]));
   long2 = TORADS(atof(argv[4]));

   dLat  = lat2 - lat1;
   dLong = long2 - long1;

   a = sin(dLat/2) * sin(dLat/2) + cos(lat1) * cos(lat2) * sin(dLong/2) * sin(dLong/2);
   c = 2 * atan2(sqrt(a), sqrt(1-a));

   printf("%g\n", EARTH_RADIUS * c);
}
