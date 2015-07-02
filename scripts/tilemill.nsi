; TileMill nsis installer script

; block creating installer unless expected variables are provided
!ifndef TARGET_ARCH
  !error "You must define TARGET_ARCH variable via makensis"
!endif
!ifndef SOURCE_ROOT
  !error "You must define SOURCE_ROOTF variable via makensis"
!endif
!ifndef OUTPUT_FILE
  !error "You must define OUTPUT_FILE variable via makensis"
!endif

SetCompressor /SOLID /FINAL lzma
SetCompressorDictSize 64

; HM NIS Edit Wizard helper defines
; directory of previous install: needed because of ProgFiles86 -> ProgFiles
Var PREV_VER_DIR
; parent directory of install
Var PAR_DIR
!define PRODUCT_DIR "TileMill"
!define PRODUCT_NAME "TileMill"
!define PRODUCT_VERSION "${VERSION}"
!define PRODUCT_PUBLISHER "Mapbox"
!define PRODUCT_WEB_SITE "https://www.mapbox.com/"
!define PRODUCT_UNINST_KEY "Software\Microsoft\Windows\CurrentVersion\Uninstall\${PRODUCT_DIR}"
!define PRODUCT_UNINST_ROOT_KEY "HKLM"
!define PRODUCT_STARTMENU_REGVAL "NSIS:StartMenuDir"

; firewall extras
!addplugindir "..\vendor\nsisFirewall-1.2\bin"
!include "FileFunc.nsh"
!include "WinVer.nsh"
!include "x64.nsh"
!insertmacro GetParent
; nsprocess
!addplugindir "..\vendor\nsProcess_1_6\Plugin"
!include "..\vendor\nsProcess_1_6\Include\nsProcess.nsh"


RequestExecutionLevel admin

; MUI 1.67 compatible ------
!include "MUI.nsh"

; MUI Settings
!define MUI_ABORTWARNING
!define MUI_ICON "assets\tilemill.ico"
!define MUI_UNICON "${NSISDIR}\Contrib\Graphics\Icons\modern-uninstall.ico"

; Welcome page
!insertmacro MUI_PAGE_WELCOME
; Start menu page
var ICONS_GROUP
!define MUI_STARTMENUPAGE_NODISABLE
!define MUI_STARTMENUPAGE_DEFAULTFOLDER "${PRODUCT_DIR}"
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

Name "${PRODUCT_DIR}"
OutFile "${OUTPUT_FILE}"

Function .onInit
  SetShellVarContext all
App_Running_Check:
  ${nsProcess::FindProcess} "tilemill.exe" $R0

  ${If} $R0 == 0
      MessageBox MB_RETRYCANCEL|MB_ICONEXCLAMATION "Please stop tilemill.exe before continuing" /SD IDCANCEL IDRETRY App_Running_Check
      Quit
  ${EndIf}

  StrCpy $INSTDIR "$programfiles32\${PRODUCT_DIR}"
  ${If} ${RunningX64}
    StrCpy $INSTDIR "$programfiles64\${PRODUCT_DIR}"
  ${EndIf}

  StrCpy $PREV_VER_DIR ""

  ${IfNot} ${AtLeastWin7}
    MessageBox MB_OK|MB_ICONEXCLAMATION "${PRODUCT_NAME} requires Windows 7 or above"
    Quit
  ${EndIf}

  ${If} ${RunningX64}
    ${If} ${TARGET_ARCH} == "x86"
      MessageBox MB_OK|MB_ICONEXCLAMATION "You are installing the 32 bit ${PRODUCT_NAME} on a 64 bit machine. This works, but for best performance it is recommended to instead install the 64 bit version."
    ${EndIf}
  ${Else}
    ${If} ${TARGET_ARCH} == "x64"
      MessageBox MB_OK|MB_ICONEXCLAMATION "Error: You are attempting to install the 64 bit ${PRODUCT_NAME} on a 32 bit machine. This will not work. Please install the 32 bit version instead."
      Quit
    ${EndIf}
  ${EndIf}

  ReadRegStr $R0 ${PRODUCT_UNINST_ROOT_KEY} \
  "${PRODUCT_UNINST_KEY}" \
  "UninstallString"
  StrCmp $R0 "" done

  ${GetParent} $R0 $PREV_VER_DIR

  MessageBox MB_OKCANCEL|MB_ICONEXCLAMATION \
    "${PRODUCT_NAME} is already installed at $PREV_VER_DIR. This entire directory \
    will be removed before upgrading.\
    $\n$\nClick 'OK' to remove \
    $PREV_VER_DIR $\nor 'Cancel' to stop this upgrade." \
    IDOK uninst
  Abort

;Run the uninstaller
uninst:
  ClearErrors
  ;Do not copy the uninstaller to a temp file
  ;otherwise ExecWait will not wait
  ExecWait '$R0 _?=$PREV_VER_DIR'
  ;manually delete remaining install dir containing uninstall.exe
  ;because it wasn't copied to a temp file
  RMDir /r "$PREV_VER_DIR\*.*"

done:

FunctionEnd

Section "MainSection" SEC01
  SetOverwrite try
  SetOutPath "$INSTDIR"
  File /r ${SOURCE_ROOT}*.*
  ExecWait "$INSTDIR\resources\app\vendor\vcredist_${TARGET_ARCH}.exe /q /norestart"
SectionEnd

; Add firewall rule
Section "Add Windows Firewall Rule"
    ; Add TileMill to the authorized list
    nsisFirewall::AddAuthorizedApplication "$INSTDIR\resources\app\vendor\node.exe" "Evented I/O for V8 JavaScript"
    Pop $0
    IntCmp $0 0 +3
        MessageBox MB_OK "Notice: unable to add node.exe (used by TileMill) to the Firewall exception list. This means that you will likely need to allow node.exe access to the firewall upon first run (code=$0)" /SD IDOK
        Return
SectionEnd

Section -AdditionalIcons
  SetShellVarContext all
  SetOutPath $INSTDIR
  !insertmacro MUI_STARTMENU_WRITE_BEGIN Application
  CreateDirectory "$SMPROGRAMS\$ICONS_GROUP"
  CreateShortCut "$SMPROGRAMS\$ICONS_GROUP\${PRODUCT_NAME}.lnk" "$INSTDIR\tilemill.exe" "" "$INSTDIR\resources\app\scripts\assets\tilemill.ico"
  CreateShortCut "$SMPROGRAMS\$ICONS_GROUP\Uninstall ${PRODUCT_NAME}.lnk" "$INSTDIR\uninstall.exe"
  !insertmacro MUI_STARTMENU_WRITE_END
SectionEnd

Section -Post
  WriteUninstaller "$INSTDIR\uninstall.exe"
  WriteRegStr ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "DisplayName" "$(^Name)"
  WriteRegStr ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "UninstallString" "$INSTDIR\uninstall.exe"
  WriteRegStr ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "URLInfoAbout" "${PRODUCT_WEB_SITE}"
  WriteRegStr ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "Publisher" "${PRODUCT_PUBLISHER}"
SectionEnd

Function un.onUninstSuccess
  SetShellVarContext all
  HideWindow
  MessageBox MB_ICONINFORMATION|MB_OK "$(^Name) was successfully removed from your computer." /SD IDOK
FunctionEnd

Section Uninstall
   SetShellVarContext all
   ${If} $PREV_VER_DIR == ""
    StrCpy $PREV_VER_DIR $INSTDIR
   ${EndIf}
   ; Remove Node.js from the authorized list
   nsisFirewall::RemoveAuthorizedApplication "$PREV_VER_DIR\resources\app\vendor\node.exe"
   Pop $0
   IntCmp $0 0 +3
       MessageBox MB_OK "A problem happened while removing node.exe (used by TileMill) from the Firewall exception list (result=$0)" /SD IDOK
       Return

  ; cd into parent directory, otherwise install dir cannot be deleted
  ${GetParent} $PREV_VER_DIR $PAR_DIR
  ;MessageBox MB_OK "PAR_DIR $PAR_DIR"
  SetOutPath "$PAR_DIR"
  Delete "$PREV_VER_DIR\*.*"
  RMDir /r "$PREV_VER_DIR\*.*"
  RMDir "$PREV_VER_DIR"
  !insertmacro MUI_STARTMENU_WRITE_BEGIN Application
  !insertmacro MUI_STARTMENU_GETFOLDER "Application" $ICONS_GROUP
  Delete "$SMPROGRAMS\$ICONS_GROUP\Uninstall ${PRODUCT_NAME}.lnk"
  Delete "$SMPROGRAMS\$ICONS_GROUP\${PRODUCT_NAME}.lnk"
  RMDir /r "$SMPROGRAMS\$ICONS_GROUP"
  !insertmacro MUI_STARTMENU_WRITE_END
  DeleteRegKey ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}"
  SetAutoClose true
SectionEnd
