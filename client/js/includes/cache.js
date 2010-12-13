/**
 * Simple static cache handler.
 */
TileMill.cache = { cache: {} };

TileMill.cache.get = function(bin, cid) {
  if (!TileMill.cache.cache[bin]) {
    return undefined;
  }
  return TileMill.cache.cache[bin][cid];
};

TileMill.cache.set = function(bin, cid, data) {
  if (!TileMill.cache.cache[bin]) {
    TileMill.cache.cache[bin] = {};
  }
  TileMill.cache.cache[bin][cid] = data;
};

TileMill.cache.clear = function(bin, cid) {
  if (!TileMill.cache.cache[bin]) {
    return;
  }
  if (cid && TileMill.cache.cache[bin][cid]) {
    delete TileMill.cache.cache[bin][cid];
  } else if (!cid) {
    TileMill.cache.cache[bin] = [];
  }
};
