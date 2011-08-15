//==============================================================================
//
//	DO NOT MODIFY THE CONTENT OF THIS FILE
//
//	This file contains the generic CFPlug-in code necessary for your importer
//	To complete your importer implement the function in GetMetadataForFile.c
//
//==============================================================================






#include <CoreFoundation/CoreFoundation.h>
#include <CoreFoundation/CFPlugInCOM.h>
#include <CoreServices/CoreServices.h>

// -----------------------------------------------------------------------------
//	constants
// -----------------------------------------------------------------------------


#define PLUGIN_ID "8E8F2C59-2B24-4B6A-A96F-A237E4C42CC6"

//
// Below is the generic glue code for all plug-ins.
//
// You should not have to modify this code aside from changing
// names if you decide to change the names defined in the Info.plist
//


// -----------------------------------------------------------------------------
//	typedefs
// -----------------------------------------------------------------------------

// The import function to be implemented in GetMetadataForFile.c
Boolean GetMetadataForURL(void *thisInterface, 
			   CFMutableDictionaryRef attributes, 
			   CFStringRef contentTypeUTI,
			   CFURLRef urlForFile);
			   
// The layout for an instance of MetaDataImporterPlugIn 
typedef struct __MetadataImporterPluginType
{
    void        *conduitInterface;
    CFUUIDRef    factoryID;
    UInt32       refCount;
} MetadataImporterPluginType;

// -----------------------------------------------------------------------------
//	prototypes
// -----------------------------------------------------------------------------
//	Forward declaration for the IUnknown implementation.
//

MetadataImporterPluginType  *AllocMetadataImporterPluginType(CFUUIDRef inFactoryID);
void                      DeallocMetadataImporterPluginType(MetadataImporterPluginType *thisInstance);
HRESULT                   MetadataImporterQueryInterface(void *thisInstance,REFIID iid,LPVOID *ppv);
void                     *MetadataImporterPluginFactory(CFAllocatorRef allocator,CFUUIDRef typeID);
ULONG                     MetadataImporterPluginAddRef(void *thisInstance);
ULONG                     MetadataImporterPluginRelease(void *thisInstance);
// -----------------------------------------------------------------------------
//	testInterfaceFtbl	definition
// -----------------------------------------------------------------------------
//	The TestInterface function table.
//

static MDImporterInterfaceStruct testInterfaceFtbl = {
    NULL,
    MetadataImporterQueryInterface,
    MetadataImporterPluginAddRef,
    MetadataImporterPluginRelease,
    NULL
};


// -----------------------------------------------------------------------------
//	AllocMetadataImporterPluginType
// -----------------------------------------------------------------------------
//	Utility function that allocates a new instance.
//      You can do some initial setup for the importer here if you wish
//      like allocating globals etc...
//
MetadataImporterPluginType *AllocMetadataImporterPluginType(CFUUIDRef inFactoryID)
{
    MetadataImporterPluginType *theNewInstance;

    theNewInstance = (MetadataImporterPluginType *)malloc(sizeof(MetadataImporterPluginType));
    memset(theNewInstance,0,sizeof(MetadataImporterPluginType));

        /* Point to the function table Malloc enough to store the stuff and copy the filler from testInterfaceFtbl over */
    theNewInstance->conduitInterface = malloc(sizeof(MDImporterInterfaceStruct));
    memcpy(theNewInstance->conduitInterface,&testInterfaceFtbl,sizeof(MDImporterInterfaceStruct));

        /*  Retain and keep an open instance refcount for each factory. */
    theNewInstance->factoryID = CFRetain(inFactoryID);
    CFPlugInAddInstanceForFactory(inFactoryID);

        /* This function returns the IUnknown interface so set the refCount to one. */
    theNewInstance->refCount = 1;
    return theNewInstance;
}

// -----------------------------------------------------------------------------
//	DeallocMBTiles_Spotlight_ImporterMDImporterPluginType
// -----------------------------------------------------------------------------
//	Utility function that deallocates the instance when
//	the refCount goes to zero.
//      In the current implementation importer interfaces are never deallocated
//      but implement this as this might change in the future
//
void DeallocMetadataImporterPluginType(MetadataImporterPluginType *thisInstance)
{
    CFUUIDRef theFactoryID;

    theFactoryID = thisInstance->factoryID;
        /* Free the conduitInterface table up */
    free(thisInstance->conduitInterface);

        /* Free the instance structure */
    free(thisInstance);
    if (theFactoryID){
        CFPlugInRemoveInstanceForFactory(theFactoryID);
        CFRelease(theFactoryID);
    }
}

static Boolean LegacyGetMetadataForFile(void* thisInterface,CFMutableDictionaryRef attributes,CFStringRef contentTypeUTI,CFStringRef pathToFile)
{
    Boolean result = FALSE;
    CFURLRef url = CFURLCreateWithFileSystemPath(kCFAllocatorDefault,pathToFile, kCFURLPOSIXPathStyle, TRUE);
    if (url) {
        result = GetMetadataForURL(thisInterface, attributes, contentTypeUTI, url);
        CFRelease(url);
    }
    
    return result;
}

// -----------------------------------------------------------------------------
//	MetadataImporterQueryInterface
// -----------------------------------------------------------------------------
//	Implementation of the IUnknown QueryInterface function.
//
HRESULT MetadataImporterQueryInterface(void *thisInstance,REFIID iid,LPVOID *ppv)
{
    CFUUIDRef interfaceID;

    interfaceID = CFUUIDCreateFromUUIDBytes(kCFAllocatorDefault,iid);

    if (CFEqual(interfaceID,kMDImporterInterfaceID)) {
            /* If the Right interface was requested, bump the ref count,
             * set the ppv parameter equal to the instance, and
             * return good status.
             */
        ((MDImporterInterfaceStruct *)((MetadataImporterPluginType *)thisInstance)->conduitInterface)->ImporterImportData = LegacyGetMetadataForFile;
        ((MDImporterInterfaceStruct *)((MetadataImporterPluginType*)thisInstance)->conduitInterface)->AddRef(thisInstance);
        *ppv = thisInstance;
        CFRelease(interfaceID);
        return S_OK;
    }
    else if (CFEqual(interfaceID,kMDImporterURLInterfaceID)) {
    
            ((MDImporterURLInterfaceStruct *)((MetadataImporterPluginType *)thisInstance)->conduitInterface)->ImporterImportURLData = GetMetadataForURL;
            ((MDImporterURLInterfaceStruct *)((MetadataImporterPluginType*)thisInstance)->conduitInterface)->AddRef(thisInstance);
            *ppv = thisInstance;
            CFRelease(interfaceID);
            return S_OK;
    }
    else if (CFEqual(interfaceID,IUnknownUUID)) {
                /* If the IUnknown interface was requested, same as above. */
            ((MDImporterInterfaceStruct *)((MetadataImporterPluginType*)thisInstance)->conduitInterface)->AddRef(thisInstance);
            *ppv = thisInstance;
            CFRelease(interfaceID);
            return S_OK;
    }
    else {
                /* Requested interface unknown, bail with error. */
            *ppv = NULL;
            CFRelease(interfaceID);
            return E_NOINTERFACE;
    }
}

// -----------------------------------------------------------------------------
//	MetadataImporterPluginAddRef
// -----------------------------------------------------------------------------
//	Implementation of reference counting for this type. Whenever an interface
//	is requested, bump the refCount for the instance. NOTE: returning the
//	refcount is a convention but is not required so don't rely on it.
//
ULONG MetadataImporterPluginAddRef(void *thisInstance)
{
    ((MetadataImporterPluginType *)thisInstance )->refCount += 1;
    return ((MetadataImporterPluginType*) thisInstance)->refCount;
}

// -----------------------------------------------------------------------------
// SampleCMPluginRelease
// -----------------------------------------------------------------------------
//	When an interface is released, decrement the refCount.
//	If the refCount goes to zero, deallocate the instance.
//
ULONG MetadataImporterPluginRelease(void *thisInstance)
{
    ((MetadataImporterPluginType*)thisInstance)->refCount -= 1;
    if (((MetadataImporterPluginType*)thisInstance)->refCount == 0){
        DeallocMetadataImporterPluginType((MetadataImporterPluginType*)thisInstance );
        return 0;
    }else{
        return ((MetadataImporterPluginType*) thisInstance )->refCount;
    }
}

// -----------------------------------------------------------------------------
//	MBTiles_Spotlight_ImporterMDImporterPluginFactory
// -----------------------------------------------------------------------------
//	Implementation of the factory function for this type.
//
void *MetadataImporterPluginFactory(CFAllocatorRef allocator,CFUUIDRef typeID)
{
    MetadataImporterPluginType *result;
    CFUUIDRef                 uuid;

        /* If correct type is being requested, allocate an
         * instance of TestType and return the IUnknown interface.
         */
    if (CFEqual(typeID,kMDImporterTypeID)){
        uuid = CFUUIDCreateFromString(kCFAllocatorDefault,CFSTR(PLUGIN_ID));
        result = AllocMetadataImporterPluginType(uuid);
        CFRelease(uuid);
        return result;
    }
        /* If the requested type is incorrect, return NULL. */
    return NULL;
}

