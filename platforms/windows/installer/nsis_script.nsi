; TileMill nsis installer script

; HM NIS Edit Wizard helper defines
!define PRODUCT_NAME "TileMill"
!define PRODUCT_VERSION "0.9.1"
!define CODE_ROOT "tilemill"
!define SEMVER "${PRODUCT_NAME}-v${PRODUCT_VERSION}"
!define PRODUCT_PUBLISHER "MapBox"
!define PRODUCT_WEB_SITE "http://mapbox.com/tilemill/docs"
!define PRODUCT_UNINST_KEY "Software\Microsoft\Windows\CurrentVersion\Uninstall\${PRODUCT_NAME}"
!define PRODUCT_UNINST_ROOT_KEY "HKLM"
!define PRODUCT_STARTMENU_REGVAL "NSIS:StartMenuDir"

; firewall extras
!addplugindir "nsisFirewall"
!include "FileFunc.nsh"

RequestExecutionLevel admin

; MUI 1.67 compatible ------
!include "MUI.nsh"

; MUI Settings
!define MUI_ABORTWARNING
!define MUI_ICON "..\..\..\tilemill.ico"
!define MUI_UNICON "${NSISDIR}\Contrib\Graphics\Icons\modern-uninstall.ico"

; Welcome page
!insertmacro MUI_PAGE_WELCOME
; Directory page
!insertmacro MUI_PAGE_DIRECTORY
; Start menu page
var ICONS_GROUP
!define MUI_STARTMENUPAGE_NODISABLE
!define MUI_STARTMENUPAGE_DEFAULTFOLDER "${SEMVER}"
!define MUI_STARTMENUPAGE_REGISTRY_ROOT "${PRODUCT_UNINST_ROOT_KEY}"
!define MUI_STARTMENUPAGE_REGISTRY_KEY "${PRODUCT_UNINST_KEY}"
!define MUI_STARTMENUPAGE_REGISTRY_VALUENAME "${PRODUCT_STARTMENU_REGVAL}"
!insertmacro MUI_PAGE_STARTMENU Application $ICONS_GROUP
; Instfiles page
!insertmacro MUI_PAGE_INSTFILES
; Finish page
!insertmacro MUI_PAGE_FINISH

; Uninstaller pages
#insertmacro MUI_UNPAGE_INSTFILES

; Language files
!insertmacro MUI_LANGUAGE "English"

; MUI end ------

Name "${PRODUCT_NAME} ${PRODUCT_VERSION}"
OutFile "${SEMVER}-Setup.exe"
InstallDir "$PROGRAMFILES\${SEMVER}"


Section "MainSection" SEC01
  SetOverwrite try
  
  SetOutPath "$INSTDIR"
  File ..\..\..\..\${PRODUCT_NAME}.exe

  SetOutPath "$INSTDIR\${CODE_ROOT}"
  File /r /x *Recycle.Bin* /x installer /x demo /x *.git \
      /x *.git* /x Makefil* /x test /x *.vcx* /x *.ipch \
	  /x ipch /x AppData /x deps /x include /x expresso \
	  /x osx /x ubuntu /x virtualbox /x *.idx /x *.pack \
	  /x *.sln /x *.sdf /x *.lib \
	  ..\..\..\..\${CODE_ROOT}\*.*
  ExecWait "$INSTDIR\${CODE_ROOT}\platforms\windows\vcredist_x86.exe /q /norestart"

SectionEnd

; Add firewall rule
Section "Add Windows Firewall Rule"
	; Add TileMill to the authorized list
	nsisFirewall::AddAuthorizedApplication "$INSTDIR\${CODE_ROOT}\node.exe" "Evented I/O for V8 JavaScript"
	Pop $0
	IntCmp $0 0 +3
		MessageBox MB_OK "Notice: unable to add node.exe (used by TileMill) to the Firewall exception list. This means that you will likely need to allow node.exe access to the firewall upon first run (code=$0)"
		Return
SectionEnd

Section -AdditionalIcons
  SetShellVarContext all
  SetOutPath $INSTDIR
  !insertmacro MUI_STARTMENU_WRITE_BEGIN Application
  CreateDirectory "$SMPROGRAMS\$ICONS_GROUP"
  CreateShortCut "$SMPROGRAMS\$ICONS_GROUP\Start ${PRODUCT_NAME}.lnk" "$INSTDIR\TileMill.exe" "" \
      "$INSTDIR\${CODE_ROOT}\tilemill.ico" "" \
	  SW_SHOWNORMAL \
      ALT|CONTROL|t "${SEMVER}"
	  
  CreateShortCut "$SMPROGRAMS\$ICONS_GROUP\Uninstall TileMill.lnk" "$INSTDIR\Uninstall-TileMill.exe"
  !insertmacro MUI_STARTMENU_WRITE_END
SectionEnd

Section -Post
  WriteUninstaller "$INSTDIR\Uninstall-TileMill.exe"
  WriteRegStr ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "DisplayName" "$(^Name)"
  WriteRegStr ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "UninstallString" "$INSTDIR\Uninstall-TileMill.exe"
  WriteRegStr ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "DisplayVersion" "${PRODUCT_VERSION}"
  WriteRegStr ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "URLInfoAbout" "${PRODUCT_WEB_SITE}"
  WriteRegStr ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "Publisher" "${PRODUCT_PUBLISHER}"
SectionEnd


Function un.onUninstSuccess
  HideWindow
  MessageBox MB_ICONINFORMATION|MB_OK "$(^Name) was successfully removed from your computer."
FunctionEnd

Function un.onInit
  MessageBox MB_ICONQUESTION|MB_YESNO|MB_DEFBUTTON2 "Are you sure you want to completely remove $(^Name) and all of its components?" IDYES +2
  Abort
FunctionEnd

Section Uninstall
   SetShellVarContext all
   ; Remove Node.js from the authorized list
   nsisFirewall::RemoveAuthorizedApplication "$INSTDIR\${CODE_ROOT}\node.exe"
   Pop $0
   IntCmp $0 0 +3
       MessageBox MB_OK "A problem happened while removing Node.exe (used by TileMill) from the Firewall exception list (result=$0)"
       Return

  Delete "$INSTDIR\Uninstall-TileMill.exe"
  Delete "$INSTDIR\TileMill.exe"
  RMDir /r "$INSTDIR\${CODE_ROOT}\*.*"
  RMDir "$INSTDIR"
  !insertmacro MUI_STARTMENU_WRITE_BEGIN Application
  !insertmacro MUI_STARTMENU_GETFOLDER "Application" $ICONS_GROUP
  Delete "$SMPROGRAMS\$ICONS_GROUP\Uninstall TileMill.lnk"
  Delete "$SMPROGRAMS\$ICONS_GROUP\Start TileMill.lnk"
  RMDir /r "$SMPROGRAMS\$ICONS_GROUP"
  !insertmacro MUI_STARTMENU_WRITE_END
  DeleteRegKey ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}"
  SetAutoClose true
SectionEnd