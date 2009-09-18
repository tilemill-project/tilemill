//
//  PFMoveApplication.m
//  LetsMove
//
//  Created by Andy Kim at Potion Factory LLC on 9/17/09
//
//  The contents of this file are dedicated to the public domain.

#import "PFMoveApplication.h"

static NSString *AlertSuppressKey = @"moveToApplicationsFolderAlertSuppress";

void PFMoveToApplicationsFolderIfNecessary()
{
	// Skip if user supressed the alert before
	if ([[NSUserDefaults standardUserDefaults] boolForKey:AlertSuppressKey]) return;

	// Path of the bundle
	NSString *path = [[NSBundle mainBundle] bundlePath];

	// Get all Applications directories, most importantly ~/Applications
	NSArray *allApplicationsDirectories = NSSearchPathForDirectoriesInDomains(NSApplicationDirectory, NSAllDomainsMask, YES);

	// If the application is already in some Applications directory, skip.
	for (NSString *appDirPath in allApplicationsDirectories) {
		if ([path hasPrefix:appDirPath]) return;
	}

	// Since we are good to go, get /Applications
	NSString *applicationsDirectory = [NSSearchPathForDirectoriesInDomains(NSApplicationDirectory, NSLocalDomainMask, YES) lastObject];
	if (applicationsDirectory == nil) {
		NSLog(@"ERROR -- Could not find the Applications directory");
		goto fail;
	}

	NSString *appBundleName = [path lastPathComponent];
	NSError *error = nil;

	// Open up the alert
	NSAlert *alert = [[[NSAlert alloc] init] autorelease];
	[alert setMessageText:NSLocalizedString(@"Move to Applications folder?", nil)];
	[alert setInformativeText:NSLocalizedString(@"I can move myself to the Applications folder if you'd like. This will keep your Downloads folder uncluttered.", nil)];
	[alert setShowsSuppressionButton:YES];
	[[[alert suppressionButton] cell] setControlSize:NSSmallControlSize];
	[[[alert suppressionButton] cell] setFont:[NSFont systemFontOfSize:[NSFont smallSystemFontSize]]];
	[alert addButtonWithTitle:NSLocalizedString(@"Move to Applications Folder", nil)];
	[alert addButtonWithTitle:NSLocalizedString(@"Do Not Move", nil)];

	if ([alert runModal] == NSAlertFirstButtonReturn) {
		NSLog(@"Moving myself to the Applications folder");
		NSFileManager *fm = [NSFileManager defaultManager];
		NSString *destinationPath = [applicationsDirectory stringByAppendingPathComponent:appBundleName];

		// If a copy already exists in /Applications, put it in the Trash
		if ([fm fileExistsAtPath:destinationPath]) {
			if (![[NSWorkspace sharedWorkspace] performFileOperation:NSWorkspaceRecycleOperation
															  source:applicationsDirectory
														 destination:@""
															   files:[NSArray arrayWithObject:appBundleName]
																 tag:NULL]) {
				NSLog(@"ERROR -- Could not trash '%@'", destinationPath);
				goto fail;
			}
		}

		// Copy myself to /Applications
		if (![fm copyItemAtPath:path toPath:destinationPath error:&error]) {
			NSLog(@"ERROR -- Could not copy myself to /Applications (%@)", error);
			goto fail;
		}

		// Put myself in Trash
		if (![[NSWorkspace sharedWorkspace] performFileOperation:NSWorkspaceRecycleOperation
														  source:[path stringByDeletingLastPathComponent]
													 destination:@""
														   files:[NSArray arrayWithObject:appBundleName]
															 tag:NULL]) {
			NSLog(@"ERROR -- Could not trash '%@'", path);
			goto fail;
		}

		// Relaunch
		NSString *executableName = [[[NSBundle mainBundle] executablePath] lastPathComponent];
		NSString *relaunchPath = [destinationPath stringByAppendingPathComponent:[NSString stringWithFormat:@"Contents/MacOS/%@", executableName]];

		[NSTask launchedTaskWithLaunchPath:relaunchPath
								 arguments:[NSArray arrayWithObjects:destinationPath,
											[NSString stringWithFormat:@"%d", [[NSProcessInfo processInfo] processIdentifier]],
											nil]]; // The %d is not a 64-bit bug. The call to processIdentifier returns an int
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
