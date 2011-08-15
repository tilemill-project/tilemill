#include <Foundation/Foundation.h>
#include <CoreFoundation/CoreFoundation.h>
#include <CoreServices/CoreServices.h>
#include <QuickLook/QuickLook.h>

#import "MBTiles.h"

/* -----------------------------------------------------------------------------
   Generate a preview for file

   This function's job is to create preview for designated file
   ----------------------------------------------------------------------------- */

OSStatus GeneratePreviewForURL(void *thisInterface, QLPreviewRequestRef preview, CFURLRef url, CFStringRef contentTypeUTI, CFDictionaryRef options)
{
    NSAutoreleasePool *pool;
    NSMutableDictionary *props, *tiles, *imgProps;
    NSMutableString *html;
    
    pool = [[NSAutoreleasePool alloc] init];
    
    // Before proceeding make sure the user didn't cancel the request
    if (QLPreviewRequestIsCancelled(preview))
        return noErr;

    // @TODO: switch from UUID to file inode+mtime
    CFUUIDRef uuid = CFUUIDCreate(kCFAllocatorDefault);
	NSString * id = (NSString*)CFMakeCollectable(CFUUIDCreateString(kCFAllocatorDefault, uuid));
	CFRelease(uuid);

    props = [[[NSMutableDictionary alloc] init] autorelease];
    [props setObject:@"UTF-8" forKey:(NSString *)kQLPreviewPropertyTextEncodingNameKey];
    [props setObject:@"text/html" forKey:(NSString *)kQLPreviewPropertyMIMETypeKey];
    
    tiles = [[[NSMutableDictionary alloc] init] autorelease];
    
    MBTiles *mbtiles = [MBTiles withURL:url];
    if (!mbtiles) return noErr;
    
    // Determine which tiles to load.
    int centerZoom = [mbtiles centerZoom];
    double lon = [mbtiles centerLongitude];
    double lat = [mbtiles centerLatitude];

    int minZ = MAX([mbtiles minZoom], centerZoom - 3);
    int maxZ = MIN([mbtiles maxZoom], minZ + 6);

    int totalTiles = 0;
    
    for (int z = minZ; z <= maxZ; z++) {
        int max = (1 << z) - 1;
        
        int x = [MBTiles xFromLongitude:lon zoom:z];
        int minX = MAX(0, x - 6);
        int maxX = MIN(max, x + 6);
        for (int x = minX; x <= maxX; x++) {
            int y = [MBTiles yFromLatitude:lat zoom:z];
            int minY = MAX(0, y - 4);
            int maxY = MIN(max, y + 4); 
            for (int y = minY; y <= maxY; y++) {
                NSData *data = [mbtiles tileAtZoom:z column:x row:y];
                
                if (data != nil) {
                    imgProps = [[[NSMutableDictionary alloc] init] autorelease];
                    [imgProps setObject:@"image/png" forKey:(NSString *)kQLPreviewPropertyMIMETypeKey];
                    [imgProps setObject:data forKey:(NSString *)kQLPreviewPropertyAttachmentDataKey];
                    
                    NSString *key = [NSString stringWithFormat:@"%s/%d/%d/%d.png", [id cStringUsingEncoding:NSUTF8StringEncoding], z, x, y];
                    [tiles setObject:imgProps forKey:key];
                    totalTiles++;
                }
            }
        }
    }
        
    [props setObject:tiles forKey:(NSString *)kQLPreviewPropertyAttachmentsKey];

    
    CFBundleRef bundle = QLPreviewRequestGetGeneratorBundle(preview);
    CFURLRef templateURL = CFBundleCopyResourceURL(bundle, (CFStringRef)@"template", (CFStringRef)@"html", NULL);
    if (!templateURL) return noErr;
    CFStringRef templatePath = CFURLCopyFileSystemPath(templateURL, kCFURLPOSIXPathStyle);
    if (!templatePath) return noErr;
    
    NSError *error;
    NSString *document = [[NSString alloc]
                          initWithContentsOfFile:(NSString*)templatePath
                          encoding:NSUTF8StringEncoding
                          error:&error];
    
    NSString *tilejson = [NSString stringWithFormat:@"{"
                            "scheme: 'xyz',"
                            "bounds: [%s],"
                            "minzoom: %d,"
                            "maxzoom: %d,"
                            "center: [%s],"
                            "tiles: ['cid:%s/{z}/{x}/{y}.png']"
                          "}", 
                          [[mbtiles bounds] cStringUsingEncoding:NSUTF8StringEncoding],
                          [mbtiles minZoom],
                          [mbtiles maxZoom],
                          [[mbtiles center] cStringUsingEncoding:NSUTF8StringEncoding],
                          [id cStringUsingEncoding:NSUTF8StringEncoding]
    ];
    
    html = [[[NSMutableString alloc] init] autorelease];
    [html appendString:[document stringByReplacingOccurrencesOfString:@"%%TILEJSON%%" withString:tilejson]];
        
    QLPreviewRequestSetDataRepresentation(preview,
                                          (CFDataRef)[html dataUsingEncoding:NSUTF8StringEncoding],
                                          kUTTypeHTML,
                                          (CFDictionaryRef)props);
    [pool release];
    
    return noErr;
}

void CancelPreviewGeneration(void* thisInterface, QLPreviewRequestRef preview)
{
    // implement only if supported
}
