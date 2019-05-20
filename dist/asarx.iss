#define AppUserId "toyobayashi.asarx"

[Setup]
AppId={#AppId}
AppName={#Name}
AppVersion={#Version}
AppVerName={#Name} {#Version}
AppPublisher={#Publisher}
AppPublisherURL={#URL}
AppSupportURL={#URL}
AppUpdatesURL={#URL}
DefaultGroupName={#Name}
AllowNoIcons=yes
OutputDir={#OutputDir}
OutputBaseFilename={#Name}-v{#Version}-win32-{#Arch}
Compression=lzma
SolidCompression=yes
SetupIconFile={#RepoDir}\app\res\icon\app.ico
UninstallDisplayIcon={app}\{#Name}.exe
ChangesAssociations=true
SourceDir={#SourceDir}
ShowLanguageDialog=auto
ArchitecturesAllowed={#ArchitecturesAllowed}
ArchitecturesInstallIn64BitMode={#ArchitecturesInstallIn64BitMode}
DefaultDirName={autopf}\{#Name}
;DisableProgramGroupPage=yes
; Uncomment the following line to run in non administrative install mode (install for current user only.)
;PrivilegesRequired=lowest

;WizardStyle=modern

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked
Name: "associatewithfiles"; Description: "Register .asar for supported file types"; GroupDescription: "Other:"; Flags: unchecked

[Files]
Source: "*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
Name: "{group}\{#Name}"; Filename: "{app}\{#Name}.exe"; AppUserModelID: "{#AppUserId}"
Name: "{autodesktop}\{#Name}"; Filename: "{app}\{#Name}.exe"; Tasks: desktopicon; AppUserModelID: "{#AppUserId}"

[Run]
Filename: "{app}\{#Name}.exe"; Description: "{cm:LaunchProgram,{#Name}}"; Flags: nowait postinstall; Check: WizardNotSilent

[Registry]
#define SoftwareClassesRootKey "HKLM"
#define RegValueName "ASARX"
Root: {#SoftwareClassesRootKey}; Subkey: "Software\Classes\.asar\OpenWithProgids"; ValueType: none; ValueName: "{#RegValueName}"; Flags: deletevalue uninsdeletevalue; Tasks: associatewithfiles
Root: {#SoftwareClassesRootKey}; Subkey: "Software\Classes\.asar\OpenWithProgids"; ValueType: string; ValueName: "{#RegValueName}.asar"; ValueData: ""; Flags: uninsdeletevalue; Tasks: associatewithfiles
Root: {#SoftwareClassesRootKey}; Subkey: "Software\Classes\{#RegValueName}.asar"; ValueType: string; ValueName: ""; ValueData: "ASAR File"; Flags: uninsdeletekey; Tasks: associatewithfiles
Root: {#SoftwareClassesRootKey}; Subkey: "Software\Classes\{#RegValueName}.asar"; ValueType: string; ValueName: "AppUserModelID"; ValueData: "{#AppUserId}"; Flags: uninsdeletekey; Tasks: associatewithfiles
Root: {#SoftwareClassesRootKey}; Subkey: "Software\Classes\{#RegValueName}.asar\DefaultIcon"; ValueType: string; ValueName: ""; ValueData: "{app}\resources\win32\{#Name}.ico"; Tasks: associatewithfiles
Root: {#SoftwareClassesRootKey}; Subkey: "Software\Classes\{#RegValueName}.asar\shell\open\command"; ValueType: string; ValueName: ""; ValueData: """{app}\{#Name}.exe"" ""%1"""; Tasks: associatewithfiles

[Code]
function WizardNotSilent(): Boolean;
begin
  Result := not WizardSilent();
end;
