//
//  PFMoveApplication.m
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

#import "PFMoveApplication.h"
#import <Security/Security.h>


static NSString *AlertSuppressKey = @"moveToApplicationsFolderAlertSuppress";


// Helper functions
static BOOL IsInApplicationsFolder(NSString *path);
static BOOL IsInDownloadsFolder(NSString *path);
static BOOL Trash(NSString *path);
static BOOL AuthorizedInstall(NSString *srcPath, NSString *dstPath, BOOL *canceled);


// Main worker function
void PFMoveToApplicationsFolderIfNecessary()
{
	// Skip if user suppressed the alert before
	if ([[NSUserDefaults standardUserDefaults] boolForKey:AlertSuppressKey]) return;

	// Path of the bundle
	NSString *bundlePath = [[NSBundle mainBundle] bundlePath];

	// Skip if the application is already in some Applications folder
	if (IsInApplicationsFolder(bundlePath)) return;

	// File Manager
	NSFileManager *fm = [NSFileManager defaultManager];

	// Fail silently if there's no access to delete the original application
	if (![fm isWritableFileAtPath:bundlePath]) {
		NSLog(@"No access to delete the app. Not offering to move it.");
		return;
	}

	// Since we are good to go, get /Applications
	NSString *applicationsDirectory = [NSSearchPathForDirectoriesInDomains(NSApplicationDirectory, NSLocalDomainMask, YES) lastObject];

	// If the user is not an Administrator, that user will not be able to put the app in /Applications.
	// So, offer to put in ~/Applications instead if it exists
	BOOL useUserApplications = applicationsDirectory == nil || ![fm isWritableFileAtPath:applicationsDirectory];
	BOOL needAuthorization = NO;

	if (useUserApplications) {
		NSLog(@"Can't write to /Applications, checking ~/Applications");
		NSString *userApplicationsDirectory = [NSSearchPathForDirectoriesInDomains(NSApplicationDirectory, NSUserDomainMask, YES) lastObject];
		NSLog(@"User applicationsDirectory: %@", userApplicationsDirectory);

		// Require authorization if there's no ~/Applications or if it's not writable
		if (userApplicationsDirectory == nil || ![fm isWritableFileAtPath:userApplicationsDirectory]) {
			needAuthorization = YES;
			useUserApplications = NO;
		}
		else {
			applicationsDirectory = userApplicationsDirectory;
		}
	}

	// Setup the alert
	NSAlert *alert = [[[NSAlert alloc] init] autorelease];
	{
		NSString *informativeText = nil;

		if (!useUserApplications) {
			[alert setMessageText:NSLocalizedString(@"Move to Applications folder?", nil)];
			informativeText = NSLocalizedString(@"I can move myself to the Applications folder if you'd like.", nil);
		}
		else {
			[alert setMessageText:NSLocalizedString(@"Move to Applications folder in your Home folder?", nil)];
			informativeText = NSLocalizedString(@"You don't have permissions to put me in the main Applications folder, but I can move myself to the Applications folder in your Home folder instead.", nil);
		}

		if (needAuthorization) {
			informativeText = [informativeText stringByAppendingString:@" "];
			informativeText = [informativeText stringByAppendingString:NSLocalizedString(@"Note that this will require an administrator password.", nil)];
		}
		else if (IsInDownloadsFolder(bundlePath)) {
			// Don't mention this stuff if we need authentication. The informative text is long enough as it is in that case.
			informativeText = [informativeText stringByAppendingString:@" "];
			informativeText = [informativeText stringByAppendingString:NSLocalizedString(@"This will keep your Downloads folder uncluttered.", nil)];
		}

		[alert setInformativeText:informativeText];

		// Add buttons
		[alert addButtonWithTitle:NSLocalizedString(@"Move to Applications Folder", nil)];
		[alert addButtonWithTitle:NSLocalizedString(@"Do Not Move", nil)];

		// Setup suppression button
		[alert setShowsSuppressionButton:YES];
		[[[alert suppressionButton] cell] setControlSize:NSSmallControlSize];
		[[[alert suppressionButton] cell] setFont:[NSFont systemFontOfSize:[NSFont smallSystemFontSize]]];
	}

	if ([alert runModal] == NSAlertFirstButtonReturn) {
		NSLog(@"Moving myself to the Applications folder");

		NSString *bundleName = [bundlePath lastPathComponent];
		NSString *destinationPath = [applicationsDirectory stringByAppendingPathComponent:bundleName];

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
				if (!Trash([applicationsDirectory stringByAppendingPathComponent:bundleName])) goto fail;
			}

			// Copy myself to the Applications folder
			NSError *error = nil;
			if (![fm copyItemAtPath:bundlePath toPath:destinationPath error:&error]) {
				NSLog(@"ERROR -- Could not copy myself to /Applications (%@)", error);
				goto fail;
			}
		}

		// Trash the original app. It's okay if this fails.
		// NOTE: This final delete does not work if the source bundle is in a network mounted volume.
		//       Calling rm or file manager's delete method doesn't work either. It's unlikely to happen
		//       but it'd be great if someone could fix this.
		if (!Trash(bundlePath)) {
			NSLog(@"WARNING -- Could not delete application after moving it to Applications folder");
		}

		// Relaunch.
		// The shell script waits until the original app process terminates.
		// This is done so that the relaunched app opens as the front-most app.
		int pid = [[NSProcessInfo processInfo] processIdentifier];
		NSString *script = [NSString stringWithFormat:@"while [ `ps -p %d > /dev/null; echo $?` -eq 0 ]; do sleep 0.1; done; /usr/bin/open '%@'", pid, destinationPath];
		[NSTask launchedTaskWithLaunchPath:@"/bin/sh" arguments:[NSArray arrayWithObjects:@"-c", script, nil]];
		[NSApp terminate:nil];
	}
	else {
		// Save the alert suppress preference if checked
		if ([[alert suppressionButton] state] == NSOnState) {
			[[NSUserDefaults standardUserDefaults] setBool:YES forKey:AlertSuppressKey];
		}
	}

	return;

fail:
	{
		// Show failure message
		NSAlert *alert = [[[NSAlert alloc] init] autorelease];
		[alert setMessageText:NSLocalizedString(@"Could not move to Applications folder", nil)];
		[alert runModal];
	}
}

#pragma mark -
#pragma mark Helper Functions

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
	// 10.5 or higher has NSDownloadsDirectory
	if (floor(NSAppKitVersionNumber) > NSAppKitVersionNumber10_4) {
		NSEnumerator *e = [NSSearchPathForDirectoriesInDomains(NSDownloadsDirectory, NSAllDomainsMask, YES) objectEnumerator];
		NSString *downloadsDirPath = nil;

		while ((downloadsDirPath = [e nextObject])) {
			if ([path hasPrefix:downloadsDirPath]) return YES;
		}

		return NO;
	}
	else {
		return [[[path stringByDeletingLastPathComponent] lastPathComponent] isEqualToString:@"Downloads"];
	}
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
