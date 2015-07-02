; nsisFirewall - Sample script

!ifdef TARGETDIR
!addplugindir "${TARGETDIR}"
!else
!addplugindir "..\bin"
!endif

Name "Sample nsisFirewall"
OutFile "Sample.exe"
ShowInstDetails show	

Section "Main program"
	; Add NOTEPAD to the authorized list
	nsisFirewall::AddAuthorizedApplication "$WINDIR\Notepad.exe" "nsisFirewall Test"
	Pop $0
	IntCmp $0 0 +3
		MessageBox MB_OK "A problem happened while adding program to Firewall exception list (result=$0)"
		Return
	Exec "rundll32.exe shell32.dll,Control_RunDLL firewall.cpl"
	MessageBox MB_OK "Program added to Firewall exception list.$\r$\n(close the control panel before clicking OK)"

	; Remove NOTEPAD from the authorized list
	nsisFirewall::RemoveAuthorizedApplication "$WINDIR\Notepad.exe"
	Pop $0
	IntCmp $0 0 +3
		MessageBox MB_OK "A problem happened while removing program to Firewall exception list (result=$0)"
		Return
	Exec "rundll32.exe shell32.dll,Control_RunDLL firewall.cpl"
	MessageBox MB_OK "Program removed to Firewall exception list"
SectionEnd
