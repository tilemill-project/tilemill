nsisFirewall 1.2 -- Small NSIS plugin for simple tasks with Windows build-in Firewall
Web site: http://wiz0u.free.fr/prog/nsisFirewall
---------------------------------------------------------

nsisFirewall allows you to perform 2 tasks :
- Add an application to Windows Firewall exception list
- Remove an application from Windows Firewall exception list

Don't bother checking if it is a version of Windows with a build-in Firewall
Don't bother checking if the Firewall is enabled
Don't ever try to completely disable the firewall
And why bother adding specific port rules when you can simply unlock the network
 for the application you're installing ?

Just call nsisFirewall::AddAuthorizedApplication at the end of your NSIS installation section
      and nsisFirewall::RemoveAuthorizedApplication in your uninstaller section



Usage
-----
nsisFirewall::AddAuthorizedApplication "<application path>" "<rule name>"
nsisFirewall::RemoveAuthorizedApplication "<application path>"

<application path> is the full path to the application you want to be authorized to
	access the network (or accept incoming connections)

<rule name> is the title that will be given to this exception entry in the firewall
	control panel list


Return Value
------------

Those 2 functions returns an integer status on the top of the stack
Possible status are:
	0:  Action was performed successfully
	<0: An error occured (the value is an HRESULT error code, see MSDN for information)
	>0: Such status should never be returned (positive HRESULTs are success codes)


Notes
-----
1) Your installer must be run with administrator rights for nsisFirewall to work
2) AddAuthorizedApplication will return a "file not found" HRESULT code if your application is 
	not installed on the system *before* calling nsisFirewall
3) RemoveAuthorizedApplication will return a success even if the application is not in the exception list
4) Most of the time you won't need to check the return value (but don't forget to Pop it)
	because there's not much you can do if nsisFirewall failed to add your application
5) Run "firewall.cpl" to display the Firewall control panel (it does not get refreshed so close/reopen it)
6) Sources should be compiled with MSVC 6.0 in order to use MSVCRT.DLL because more
	recent runtime libraries DLL might not be available on the target system

Sample scripts
--------------

	; Add NOTEPAD to the authorized list
	nsisFirewall::AddAuthorizedApplication "$WINDIR\Notepad.exe" "nsisFirewall Test"
	Pop $0
	IntCmp $0 0 +3
		MessageBox MB_OK "An error happened while adding program to Firewall exception list (result=$0)"
		Return
	MessageBox MB_OK "Program added to Firewall exception list"

	; Remove NOTEPAD from the authorized list
	nsisFirewall::RemoveAuthorizedApplication "$WINDIR\Notepad.exe"
	Pop $0
	IntCmp $0 0 +3
		MessageBox MB_OK "An error happened while removing program to Firewall exception list (result=$0)"
		Return
	MessageBox MB_OK "Program removed to Firewall exception list"

Version history
---------------
1.2 : added a Unicode-NSIS version (nsisFirewallW) -- Thanks to Guilherme B. Versiani
1.1 : Correctly handle 2 errors cases
1.0 : First release


License
-------
Copyright (c) 2007-2009 Olivier Marcoux

This software is provided 'as-is', without any express or implied warranty. In no event will the authors be held liable for any damages arising from the use of this software.

Permission is granted to anyone to use this software for any purpose, including commercial applications, and to alter it and redistribute it freely, subject to the following restrictions:

    1. The origin of this software must not be misrepresented; you must not claim that you wrote the original software. If you use this software in a product, an acknowledgment in the product documentation would be appreciated but is not required.

    2. Altered source versions must be plainly marked as such, and must not be misrepresented as being the original software.

    3. This notice may not be removed or altered from any source distribution.
