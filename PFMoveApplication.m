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

	// Get all Applications directories including ~/Applications
	NSArray *allApplicationsDirectories = NSSearchPathForDirectoriesInDomains(NSApplicationDirectory, NSAllDomainsMask, YES);

	// If the application is already in some Applications directory, skip.
	for (NSString *appDirPath in allApplicationsDirectories) {
		if ([bundlePath hasPrefix:appDirPath]) return;
	}

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

	// Open up the alert
	NSAlert *alert = [[[NSAlert alloc] init] autorelease];
	if (!useUserApplications) {
		[alert setMessageText:NSLocalizedString(@"Move to Applications folder?", nil)];
		[alert setInformativeText:NSLocalizedString(@"I can move myself to the Applications folder if you'd like. This will keep your Downloads folder uncluttered.", nil)];
	}
	else {
		[alert setMessageText:NSLocalizedString(@"Move to Applications folder in your Home folder?", nil)];
		[alert setInformativeText:NSLocalizedString(@"I can move myself to the Applications folder in your Home folder if you'd like. This will keep your Downloads folder uncluttered.", nil)];
	}
	[alert addButtonWithTitle:NSLocalizedString(@"Move to Applications Folder", nil)];
	[alert addButtonWithTitle:NSLocalizedString(@"Do Not Move", nil)];
	[alert setShowsSuppressionButton:YES];
	[[[alert suppressionButton] cell] setControlSize:NSSmallControlSize];
	[[[alert suppressionButton] cell] setFont:[NSFont systemFontOfSize:[NSFont smallSystemFontSize]]];

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

		// Relaunch
		NSString *executableName = [[[NSBundle mainBundle] executablePath] lastPathComponent];
		NSString *relaunchPath = [destinationPath stringByAppendingPathComponent:[NSString stringWithFormat:@"Contents/MacOS/%@", executableName]];

		[NSTask launchedTaskWithLaunchPath:relaunchPath arguments:[NSArray array]];
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
