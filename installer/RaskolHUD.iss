#define AppVersion "0.5.0"
#define DistDir AddBackslash(SourcePath) + "..\dist"

[Setup]
AppId={{A7F39C3B-AB1A-4E88-9A12-6E7C7D6F05A0}
AppName=РАСКОЛ — Установка HUD
AppVersion={#AppVersion}
AppPublisher=РАСКОЛ
DefaultDirName={userappdata}\.minecraft\mods
DisableDirPage=yes
DisableProgramGroupPage=yes
Uninstallable=yes
PrivilegesRequired=lowest
OutputDir=..\dist
OutputBaseFilename=RaskolHUD-Installer-{#AppVersion}
Compression=lzma2
SolidCompression=yes
WizardStyle=modern
SetupLogging=yes
CloseApplications=no
ArchitecturesInstallIn64BitMode=x64
UninstallDisplayName=РАСКОЛ — HUD 0.5.0

[Languages]
Name: "russian"; MessagesFile: "compiler:Languages\Russian.isl"

[Messages]
WelcomeLabel1=Установка интерфейса РАСКОЛА
WelcomeLabel2=Мастер установит клиентский HUD и Fabric API в стандартную папку Minecraft.
FinishedLabel=Установка завершена. Запусти Minecraft 26.2 через профиль Fabric.

[Files]
Source: "{#DistDir}\raskolhud-client-0.5.0.jar"; DestDir: "{code:GetModsDir}"; Flags: ignoreversion
Source: "{#DistDir}\fabric-api-0.161.0+26.2.jar"; DestDir: "{code:GetModsDir}"; Flags: ignoreversion

[InstallDelete]
; Удаляем только предыдущие версии этих двух компонентов, не затрагивая остальные моды.
Type: files; Name: "{code:GetModsDir}\raskolhud-client-*.jar"
Type: files; Name: "{code:GetModsDir}\fabric-api-*.jar"

[Code]
function GetModsDir(Param: String): String;
begin
  Result := ExpandConstant('{userappdata}\.minecraft\mods');
end;

function PrepareToInstall(var NeedsRestart: Boolean): String;
var
  ModsPath: String;
begin
  Result := '';
  ModsPath := GetModsDir('');
  if not ForceDirectories(ModsPath) then
    Result := 'Не удалось создать папку модов Minecraft:' + #13#10 + ModsPath;
end;

function InitializeSetup(): Boolean;
begin
  Result := True;
  if MsgBox(
    'Будут установлены два файла в:' + #13#10 +
    ExpandConstant('{userappdata}\.minecraft\mods') + #13#10#13#10 +
    'Установщик заменит предыдущие версии RaskolHUD и Fabric API в этой папке. Продолжить?',
    mbConfirmation, MB_YESNO) = IDNO then
    Result := False;
end;
