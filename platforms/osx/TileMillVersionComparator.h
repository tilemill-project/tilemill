#import <Sparkle/SUVersionComparisonProtocol.h>

@interface TileMillVersionComparator : NSObject <SUVersionComparison>

- (NSComparisonResult)compareVersion:(NSString *)versionA toVersion:(NSString *)versionB;

@end