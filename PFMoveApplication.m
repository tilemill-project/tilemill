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

#import "PFMoveApplication.h"

static NSString *AlertSuppressKey = @"moveToApplicationsFolderAlertSuppress";

// Helper functions
static BOOL IsInApplicationsFolder(NSString *path);
static BOOL IsInDownloadsFolder(NSString *path);

// Main worker function
void PFMoveToApplicationsFolderIfNecessary()
{
	// Skip if user suppressed the alert before
	if ([[NSUserDefaults standardUserDefaults] boolForKey:AlertSuppressKey]) return;

	// Path of the bundle
	NSString *bundlePath = [[NSBundle mainBundle] bundlePath];

	// File Manager
	NSFileManager *fm = [NSFileManager defaultManager];

	// Fail silently if there's no access to delete the original application
	if (![fm isWritableFileAtPath:bundlePath]) {
		NSLog(@"No access to delete the app. Not offering to move it.");
		return;
	}

	// Skip if the application is already in some Applications folder
	if (IsInApplicationsFolder(bundlePath)) return;

	// Since we are good to go, get /Applications
	NSString *applicationsDirectory = [NSSearchPathForDirectoriesInDomains(NSApplicationDirectory, NSLocalDomainMask, YES) lastObject];

	// If the user is not an Administrator, that user will not be able to put the app in /Applications.
	// So, offer to put in ~/Applications instead if it exists
	BOOL useUserApplications = applicationsDirectory == nil || ![fm isWritableFileAtPath:applicationsDirectory];

	if (useUserApplications) {
		NSLog(@"Can't write to /Applications, checking ~/Applications");
		applicationsDirectory = [NSSearchPathForDirectoriesInDomains(NSApplicationDirectory, NSUserDomainMask, YES) lastObject];
		NSLog(@"User applicationsDirectory: %@", applicationsDirectory);

		// Fail silently if there's no ~/Applications or if it's not writable
		if (applicationsDirectory == nil || ![fm isWritableFileAtPath:applicationsDirectory]) {
			return;
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

		if (IsInDownloadsFolder(bundlePath)) {
			informativeText = [informativeText stringByAppendingString:@" "];
			informativeText = [informativeText stringByAppendingString:NSLocalizedString(@"This will keep your Downloads folder uncluttered", nil)];
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

		// If a copy already exists in the Applications folder, put it in the Trash
		if ([fm fileExistsAtPath:destinationPath]) {
			if (![[NSWorkspace sharedWorkspace] performFileOperation:NSWorkspaceRecycleOperation
															  source:applicationsDirectory
														 destination:@""
															   files:[NSArray arrayWithObject:bundleName]
																 tag:NULL]) {
				NSLog(@"ERROR -- Could not trash '%@'", destinationPath);
				goto fail;
			}
		}

		// Copy myself to the Applications folder
		NSError *error = nil;
		if (![fm copyItemAtPath:bundlePath toPath:destinationPath error:&error]) {
			NSLog(@"ERROR -- Could not copy myself to /Applications (%@)", error);
			goto fail;
		}

		// Put myself in Trash
		if (![[NSWorkspace sharedWorkspace] performFileOperation:NSWorkspaceRecycleOperation
														  source:[bundlePath stringByDeletingLastPathComponent]
													 destination:@""
														   files:[NSArray arrayWithObject:bundleName]
															 tag:NULL]) {
			NSLog(@"ERROR -- Could not trash '%@'", bundlePath);
			goto fail;
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
	NSArray *allApplicationsDirectories = NSSearchPathForDirectoriesInDomains(NSApplicationDirectory, NSAllDomainsMask, YES);

	// If the application is already in some Applications directory, skip.
	for (NSString *appDirPath in allApplicationsDirectories) {
		if ([path hasPrefix:appDirPath]) return YES;
	}

	return NO;
}

static BOOL IsInDownloadsFolder(NSString *path)
{
	NSArray *allDownloadsDirectories = NSSearchPathForDirectoriesInDomains(NSDownloadsDirectory, NSAllDomainsMask, YES);

	// If the application is already in some Applications directory, skip.
	for (NSString *downloadsDirPath in allDownloadsDirectories) {
		if ([path hasPrefix:downloadsDirPath]) return YES;
	}

	return NO;
}
