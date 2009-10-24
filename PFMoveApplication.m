//
//  PFMoveApplication.m, version 1.1
//  LetsMove
//
//  Created by Andy Kim at Potion Factory LLC on 9/17/09
//
//  The contents of this file are dedicated to the public domain.
//
//  Contributors:
//	  Andy Kim
//    John Brayton
//    Chad Sellers
//    Eita Hayashi (Japanese localization)
//    Rasmus Andersson / Spotify
//

#import "PFMoveApplication.h"
#import <Security/Security.h>

// Strings
// These are macros to be able to use custom i18n tools
#define _I10NS(nsstr) NSLocalizedStringFromTable(nsstr, @"MoveApplication", nil)
#define kStrMoveApplicationCouldNotMove _I10NS(@"Could not move to Applications folder")
#define kStrMoveApplicationQuestionTitle  _I10NS(@"Move to Applications folder?")
#define kStrMoveApplicationQuestionTitleHome _I10NS(@"Move to Applications folder in your Home folder?")
#define kStrMoveApplicationQuestionMessage _I10NS(@"I can move myself to the Applications folder if you'd like.")
#define kStrMoveApplicationButtonMove _I10NS(@"Move to Applications Folder")
#define kStrMoveApplicationButtonDoNotMove _I10NS(@"Do Not Move")
#define kStrMoveApplicationQuestionInfoWillRequirePasswd _I10NS(@"Note that this will require an administrator password.")
#define kStrMoveApplicationQuestionInfoInDownloadsFolder _I10NS(@"This will keep your Downloads folder uncluttered.")
#define kStrMoveApplicationAddToDock _I10NS(@"Add to Dock")

// Need to be defined
#ifndef NSAppKitVersionNumber10_4
	#define NSAppKitVersionNumber10_4 824
#endif

// Experimental feature: Add to Dock
//
// Enabling this adds a "Add to Dock" checkbox, enabling the user to
// automatically have the app added to the Dock.
// 
// Note: This is a feature you should think really hard about before enabling.
// The OS X user experience will be bad unless the user in the general use 
// cases _do want_ the icon in the Dock.
#ifndef PFMOVE_INCLUDE_ADD_TO_DOCK_OPTION
	#define PFMOVE_INCLUDE_ADD_TO_DOCK_OPTION 0
#endif
// Controls if the checkbox is checked by default or not
#ifndef PFMOVE_INCLUDE_ADD_TO_DOCK_DEFAULT_STATE
	#define PFMOVE_INCLUDE_ADD_TO_DOCK_DEFAULT_STATE NSOnState
#endif


static NSString *AlertSuppressKey = @"moveToApplicationsFolderAlertSuppress";


// Helper functions
static NSString *PreferredInstallLocation(BOOL *isUserDirectory);
static BOOL IsInApplicationsFolder(NSString *path);
static BOOL IsInDownloadsFolder(NSString *path);
static BOOL Trash(NSString *path);
static BOOL AuthorizedInstall(NSString *srcPath, NSString *dstPath, BOOL *canceled);
static BOOL CopyBundle(NSString *srcPath, NSString *dstPath);

// Main worker function
void PFMoveToApplicationsFolderIfNecessary() {
	// Skip if user suppressed the alert before
	if ([[NSUserDefaults standardUserDefaults] boolForKey:AlertSuppressKey]) return;
	
	// Path of the bundle
	NSString *bundlePath = [[NSBundle mainBundle] bundlePath];
	
	// Skip if the application is already in some Applications folder
	if (IsInApplicationsFolder(bundlePath)) return;
	
	// File Manager
	NSFileManager *fm = [NSFileManager defaultManager];
	BOOL bundlePathIsWritable = [fm isWritableFileAtPath:bundlePath];
	
	// Guess if we have launched from a disk image
	BOOL isLaunchedFromDMG = ([bundlePath hasPrefix:@"/Volumes/"] && !bundlePathIsWritable);
	
	// Fail silently if there's no access to delete the original application
	if (!isLaunchedFromDMG && !bundlePathIsWritable) {
		NSLog(@"No access to delete the app. Not offering to move it.");
		return;
	}
	
	// Since we are good to go, get the preferred installation directory.
	BOOL installToUserApplications = NO;
	NSString *applicationsDirectory = PreferredInstallLocation(&installToUserApplications);
	NSString *bundleName = [bundlePath lastPathComponent];
	NSString *destinationPath = [applicationsDirectory stringByAppendingPathComponent:bundleName];
	
	// Check if we need admin password to write to the Applications directory
	BOOL needAuthorization = ([fm isWritableFileAtPath:applicationsDirectory] == NO);
	
#if PFMOVE_INCLUDE_ADD_TO_DOCK_OPTION
	NSButton *addToDockCheckbox = nil;
#endif
	
	// Setup the alert
	NSAlert *alert = [[[NSAlert alloc] init] autorelease];
	{
		NSString *informativeText = nil;
		
		[alert setMessageText:(installToUserApplications ? kStrMoveApplicationQuestionTitleHome : kStrMoveApplicationQuestionTitle)];
		
		informativeText = kStrMoveApplicationQuestionMessage;
		
		if (needAuthorization) {
			informativeText = [informativeText stringByAppendingString:@" "];
			informativeText = [informativeText stringByAppendingString:kStrMoveApplicationQuestionInfoWillRequirePasswd];
		}
		else if (IsInDownloadsFolder(bundlePath)) {
			// Don't mention this stuff if we need authentication. The informative text is long enough as it is in that case.
			informativeText = [informativeText stringByAppendingString:@" "];
			informativeText = [informativeText stringByAppendingString:kStrMoveApplicationQuestionInfoInDownloadsFolder];
		}
		
		[alert setInformativeText:informativeText];
		
		// Add accept button
		[alert addButtonWithTitle:kStrMoveApplicationButtonMove];
		
		// Add deny button
		NSButton *cancelButton = [alert addButtonWithTitle:kStrMoveApplicationButtonDoNotMove];
		[cancelButton setKeyEquivalent:@"\e"];
		
		// Add "Add to Dock" checkbox
#if PFMOVE_INCLUDE_ADD_TO_DOCK_OPTION
		// Only go ahead if the app is not already in the Dock
		NSTask *ps = [NSTask launchedTaskWithLaunchPath:@"/bin/sh" arguments:[NSArray arrayWithObjects:@"-c", [NSString stringWithFormat:@"defaults read com.apple.dock persistent-apps | grep '%@/' >/dev/null 2>&1", destinationPath], nil]];
		[ps waitUntilExit];
		if ([ps terminationStatus] != 0) {
			NSRect cboxFrame = NSMakeRect(0.0,0.0,[[alert window] frame].size.width,18.0);
			NSView *av = [[[NSView alloc] initWithFrame:cboxFrame] autorelease];
			addToDockCheckbox = [[[NSButton alloc] initWithFrame:cboxFrame] autorelease];
			[addToDockCheckbox setButtonType:NSSwitchButton];
			[[addToDockCheckbox cell] setControlSize:NSSmallControlSize];
			[[addToDockCheckbox cell] setFont:[NSFont systemFontOfSize:[NSFont systemFontSizeForControlSize:NSSmallControlSize]]];
			[addToDockCheckbox setState:NSOnState];
			[addToDockCheckbox setTitle:kStrMoveApplicationAddToDock];
			[addToDockCheckbox sizeToFit];
			[av addSubview:addToDockCheckbox];
			[alert setAccessoryView:av];
		}
#endif
		
#if MAC_OS_X_VERSION_MAX_ALLOWED > MAC_OS_X_VERSION_10_4
		if (floor(NSAppKitVersionNumber) > NSAppKitVersionNumber10_4) {
			// Setup suppression button
			[alert setShowsSuppressionButton:YES];
			[[[alert suppressionButton] cell] setControlSize:NSSmallControlSize];
			[[[alert suppressionButton] cell] setFont:[NSFont systemFontOfSize:[NSFont smallSystemFontSize]]];
		}
#endif
	}
	
	if ([alert runModal] == NSAlertFirstButtonReturn) {
		NSLog(@"Moving myself to the Applications folder");
		
		// Add to Dock
#if PFMOVE_INCLUDE_ADD_TO_DOCK_OPTION
		if (addToDockCheckbox && [addToDockCheckbox state] == NSOnState) {
			// Note: here, we could have a if (not already in dock) {... but we trust
			// that the initial check (when building the alert box) is ok.
			NSLog(@"Adding myself to the Dock");
			NSTask *addTask = [NSTask launchedTaskWithLaunchPath:@"/usr/bin/defaults" arguments:[NSArray arrayWithObjects:@"write", @"com.apple.dock", @"persistent-apps", @"-array-add", [NSString stringWithFormat:@"<dict><key>tile-data</key><dict><key>file-data</key><dict><key>_CFURLString</key><string>%@</string><key>_CFURLStringType</key><integer>0</integer></dict></dict><key>tile-type</key><string>file-tile</string></dict>", destinationPath], nil]];
			[addTask waitUntilExit];
			if ([addTask terminationStatus] != 0) {
				NSLog(@"failed to add myself to the dock");
			}
			else {
				// Delay reloading of Dock until we guess the new app is running.
				// We do this to avoid the "blank icon" bug.
				[NSTask launchedTaskWithLaunchPath:@"/bin/sh" arguments:[NSArray arrayWithObjects:@"-c", @"sleep 4; killall -HUP Dock", nil]];
			}
		}
#endif
		
		// Move
		if (needAuthorization) {
			BOOL authorizationCanceled;
			
			if (!AuthorizedInstall(bundlePath, destinationPath, &authorizationCanceled)) {
				if (authorizationCanceled) {
					NSLog(@"INFO -- Not moving because user canceled authorization");
					return;
				}
				else {
					NSLog(@"ERROR -- Could not copy myself to /Applications with authorization");
					goto fail;
				}
			}
		}
		else {
			// If a copy already exists in the Applications folder, put it in the Trash
			if ([fm fileExistsAtPath:destinationPath]) {
				// If the app at destinationPath is running already, give that app focus and exit.
				NSTask *ps = [NSTask launchedTaskWithLaunchPath:@"/bin/sh" arguments:[NSArray arrayWithObjects:@"-c", [NSString stringWithFormat:@"ps xa -o pid,comm | grep '%@/' | grep -v grep | cut -d' ' -f1 | grep -v '^%d$' >/dev/null", destinationPath, getpid()], nil]];
				[ps waitUntilExit];
				if ([ps terminationStatus] == 0) {
					NSLog(@"Switching to an already running version");
					[[NSTask launchedTaskWithLaunchPath:@"/usr/bin/open" arguments:[NSArray arrayWithObject:destinationPath]] waitUntilExit];
					[NSApp terminate:nil];
				}
				if (!Trash([applicationsDirectory stringByAppendingPathComponent:bundleName]))
					goto fail;
			}
			
 			if (!CopyBundle(bundlePath, destinationPath)) {
				NSLog(@"ERROR -- Could not copy myself to /Applications");
				goto fail;
			}
		}
		
		// Trash the original app. It's okay if this fails.
		// NOTE: This final delete does not work if the source bundle is in a network mounted volume.
		//       Calling rm or file manager's delete method doesn't work either. It's unlikely to happen
		//       but it'd be great if someone could fix this.
		if (!isLaunchedFromDMG && !Trash(bundlePath)) {
			NSLog(@"WARNING -- Could not delete application after moving it to Applications folder");
		}
		
		// Relaunch.
		// The shell script waits until the original app process terminates.
		// This is done so that the relaunched app opens as the front-most app.
		int pid = [[NSProcessInfo processInfo] processIdentifier];
		NSString *script = [NSString stringWithFormat:@"while [ `ps -p %d | wc -l` -gt 1 ]; do sleep 0.1; done; open '%@'", pid, destinationPath];
		[NSTask launchedTaskWithLaunchPath:@"/bin/sh" arguments:[NSArray arrayWithObjects:@"-c", script, nil]];
		
		// Launched from within a DMG? -- unmount (if no files are open after 5 seconds,
		// otherwise leave it mounted).
		if (isLaunchedFromDMG) {
			NSString *script = [NSString stringWithFormat:@"(sleep 5 && hdiutil detach '%@') &", [bundlePath stringByDeletingLastPathComponent]];
			[NSTask launchedTaskWithLaunchPath:@"/bin/sh" arguments:[NSArray arrayWithObjects:@"-c", script, nil]];
		}
		
		[NSApp terminate:nil];
	}
	else {
		if (floor(NSAppKitVersionNumber) > NSAppKitVersionNumber10_4) {
			// Save the alert suppress preference if checked
#if MAC_OS_X_VERSION_MAX_ALLOWED > MAC_OS_X_VERSION_10_4
			if ([[alert suppressionButton] state] == NSOnState) {
				[[NSUserDefaults standardUserDefaults] setBool:YES forKey:AlertSuppressKey];
			}
#endif
		}
		else {
			// Always suppress after the first decline on 10.4 since there is no suppression checkbox
			[[NSUserDefaults standardUserDefaults] setBool:YES forKey:AlertSuppressKey];
		}
	}
	
	return;
	
fail:
	{
		// Show failure message
		NSAlert *alert = [[[NSAlert alloc] init] autorelease];
		[alert setMessageText:kStrMoveApplicationCouldNotMove];
		[alert runModal];
	}
}

#pragma mark -
#pragma mark Helper Functions

static NSString *PreferredInstallLocation(BOOL *isUserDirectory)
{
	// Return the preferred install location.
	// Assume that if the user has a ~/Applications folder, they'd prefer their
	// applications to go there.
	
	NSFileManager *fm = [NSFileManager defaultManager];
	
	NSArray *userApplicationsDirs = NSSearchPathForDirectoriesInDomains(NSApplicationDirectory, NSUserDomainMask, YES);
	
	if ([userApplicationsDirs count] > 0) {
		NSString *userApplicationsDir = [userApplicationsDirs objectAtIndex:0];
		BOOL isDirectory;
		
		if ([fm fileExistsAtPath:userApplicationsDir isDirectory:&isDirectory] && isDirectory) {
			if (isUserDirectory) *isUserDirectory = YES;
			return userApplicationsDir;
		}
	}
	
	// No user Applications directory. Return the machine local Applications directory
	if (isUserDirectory) *isUserDirectory = NO;
	return [NSSearchPathForDirectoriesInDomains(NSApplicationDirectory, NSLocalDomainMask, YES) lastObject];
}

static BOOL IsInApplicationsFolder(NSString *path)
{
	NSEnumerator *e = [NSSearchPathForDirectoriesInDomains(NSApplicationDirectory, NSAllDomainsMask, YES) objectEnumerator];
	NSString *appDirPath = nil;
	
	while ((appDirPath = [e nextObject])) {
		if ([path hasPrefix:appDirPath]) return YES;
	}
	
	return NO;
}

static BOOL IsInDownloadsFolder(NSString *path)
{
#if MAC_OS_X_VERSION_MAX_ALLOWED > MAC_OS_X_VERSION_10_4
	// 10.5 or higher has NSDownloadsDirectory
	if (floor(NSAppKitVersionNumber) > NSAppKitVersionNumber10_4) {
		NSEnumerator *e = [NSSearchPathForDirectoriesInDomains(NSDownloadsDirectory, NSAllDomainsMask, YES) objectEnumerator];
		NSString *downloadsDirPath = nil;
		
		while ((downloadsDirPath = [e nextObject])) {
			if ([path hasPrefix:downloadsDirPath]) return YES;
		}
		
		return NO;
	}
#endif
	// 10.4
	return [[[path stringByDeletingLastPathComponent] lastPathComponent] isEqualToString:@"Downloads"];
}

static BOOL Trash(NSString *path)
{
	if ([[NSWorkspace sharedWorkspace] performFileOperation:NSWorkspaceRecycleOperation
													 source:[path stringByDeletingLastPathComponent]
												destination:@""
													  files:[NSArray arrayWithObject:[path lastPathComponent]]
														tag:NULL]) {
		return YES;
	}
	else {
		NSLog(@"ERROR -- Could not trash '%@'", path);
		return NO;
	}
}

static BOOL AuthorizedInstall(NSString *srcPath, NSString *dstPath, BOOL *canceled)
{
	if (canceled) *canceled = NO;
	
	// Make sure that the destination path is an app bundle. We're essentially running 'sudo rm -rf'
	// so we really don't want to fuck this up.
	if (![dstPath hasSuffix:@".app"]) return NO;
	
	// Do some more checks
	if ([[dstPath stringByTrimmingCharactersInSet:[NSCharacterSet whitespaceCharacterSet]] length] == 0) return NO;
	if ([[srcPath stringByTrimmingCharactersInSet:[NSCharacterSet whitespaceCharacterSet]] length] == 0) return NO;
	
	int pid, status;
	AuthorizationRef myAuthorizationRef;
	
	// Get the authorization
	OSStatus err = AuthorizationCreate(NULL, kAuthorizationEmptyEnvironment, kAuthorizationFlagDefaults, &myAuthorizationRef);
	if (err != errAuthorizationSuccess) return NO;
	
	AuthorizationItem myItems = {kAuthorizationRightExecute, 0, NULL, 0};
	AuthorizationRights myRights = {1, &myItems};
	AuthorizationFlags myFlags = kAuthorizationFlagInteractionAllowed | kAuthorizationFlagPreAuthorize | kAuthorizationFlagExtendRights;
	
	err = AuthorizationCopyRights(myAuthorizationRef, &myRights, NULL, myFlags, NULL);
	if (err != errAuthorizationSuccess) {
		if (err == errAuthorizationCanceled && canceled)
			*canceled = YES;
		goto fail;
	}
	
	// Delete the destination
	{
		char *args[] = {"-rf", (char *)[dstPath UTF8String], NULL};
		err = AuthorizationExecuteWithPrivileges(myAuthorizationRef, "/bin/rm", kAuthorizationFlagDefaults, args, NULL);
		if (err != errAuthorizationSuccess) goto fail;
		
		// Wait until it's done
		pid = wait(&status);
		if (pid == -1 || !WIFEXITED(status)) goto fail; // We don't care about exit status as the destination most likely does not exist
	}
	
	// Copy
	{
		char *args[] = {"-pR", (char *)[srcPath UTF8String], (char *)[dstPath UTF8String], NULL};
		err = AuthorizationExecuteWithPrivileges(myAuthorizationRef, "/bin/cp", kAuthorizationFlagDefaults, args, NULL);
		if (err != errAuthorizationSuccess) goto fail;
		
		// Wait until it's done
		pid = wait(&status);
		if (pid == -1 || !WIFEXITED(status) || WEXITSTATUS(status)) goto fail;
	}
	
	AuthorizationFree(myAuthorizationRef, kAuthorizationFlagDefaults);
	return YES;
	
fail:
	AuthorizationFree(myAuthorizationRef, kAuthorizationFlagDefaults);
	return NO;
}

static BOOL CopyBundle(NSString *srcPath, NSString *dstPath)
{
	NSFileManager *fm = [NSFileManager defaultManager];
	
#if MAC_OS_X_VERSION_MAX_ALLOWED > MAC_OS_X_VERSION_10_4
	// 10.5 or higher
	if (floor(NSAppKitVersionNumber) > NSAppKitVersionNumber10_4) {
		NSError *error = nil;
		if (![fm copyItemAtPath:srcPath toPath:dstPath error:&error]) {
			NSLog(@"Could not copy '%@' to '%@' (%@)", srcPath, dstPath, error);
			return NO;
		}
		return YES;
	}
#endif
#if MAC_OS_X_VERSION_MIN_REQUIRED <= MAC_OS_X_VERSION_10_4
	// 10.4. Welcome to the whack a deprecation warning show
	BOOL success = NO;
	SEL selector = @selector(copyPath:toPath:handler:);
	NSMethodSignature *methodSig = [fm methodSignatureForSelector:selector];
	NSInvocation *invocation = [NSInvocation invocationWithMethodSignature:methodSig];
	id nilPointer = nil;
	[invocation setSelector:selector];
	[invocation setArgument:&srcPath atIndex:2];
	[invocation setArgument:&dstPath atIndex:3];
	[invocation setArgument:&nilPointer atIndex:4];
	[invocation invokeWithTarget:fm];
	[invocation getReturnValue:&success];
	
	if (!success) {
		NSLog(@"Could not copy '%@' to '%@'", srcPath, dstPath);
	}
	
	return success;
#else
	return NO;
#endif
}