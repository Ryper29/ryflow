$ErrorActionPreference = "SilentlyContinue"
$OutputEncoding = [System.Text.Encoding]::UTF8
try { [Console]::OutputEncoding = [System.Text.Encoding]::UTF8 } catch {}

Add-Type -AssemblyName System.Runtime.WindowsRuntime

# Deklarasi penuh tipe WinRT ke dalam variabel agar PowerShell tidak gagal mengenali tipe
$tManager = [Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager, Windows.Media.Control, ContentType = WindowsRuntime]
$tProps = [Windows.Media.Control.GlobalSystemMediaTransportControlsSessionMediaProperties, Windows.Media.Control, ContentType = WindowsRuntime]
$tStream = [Windows.Storage.Streams.IRandomAccessStreamWithContentType, Windows.Storage.Streams, ContentType = WindowsRuntime]

$asTaskGeneric = ([System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object {
        $_.Name -eq 'AsTask' -and
        $_.GetParameters().Count -eq 1 -and
        $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1'
    })[0]

function Await($WinRtTask, $ResultType) {
    if ($null -eq $WinRtTask) { return $null }
    $asTask = $asTaskGeneric.MakeGenericMethod($ResultType)
    $netTask = $asTask.Invoke($null, @($WinRtTask))
    $netTask.Wait(3000) | Out-Null
    if ($netTask.IsCompleted -and -not $netTask.IsFaulted) {
        return $netTask.Result
    }
    return $null
}

$manager = Await ([Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager]::RequestAsync()) $tManager

$cmdFile = Join-Path $PSScriptRoot ".media-cmd"
$lastTrackKey = ""
$cachedThumbnail = $null
$tick = 0

while ($true) {
    # Cari sesi yang sedang berstatus 'Playing' terlebih dahulu (misal Spotify saat Chrome juga buka)
    $session = $null
    $sessions = $manager.GetSessions()
    if ($null -ne $sessions) {
        foreach ($s in $sessions) {
            $pb = $s.GetPlaybackInfo()
            if ($null -ne $pb -and $pb.PlaybackStatus.ToString() -eq "Playing") {
                $session = $s
                break
            }
        }
    }
    if ($null -eq $session) {
        $session = $manager.GetCurrentSession()
    }

    $forceUpdate = $false

    # Cek apakah ada perintah tombol dari ryflow
    if ([System.IO.File]::Exists($cmdFile)) {
        try {
            $cmd = [System.IO.File]::ReadAllText($cmdFile).Trim()
            [System.IO.File]::Delete($cmdFile)

            if ($null -ne $session -and $cmd) {
                if ($cmd -eq "playpause") {
                    Await ($session.TryTogglePlayPauseAsync()) ([bool]) | Out-Null
                }
                elseif ($cmd -eq "next") {
                    Await ($session.TrySkipNextAsync()) ([bool]) | Out-Null
                }
                elseif ($cmd -eq "prev") {
                    Await ($session.TrySkipPreviousAsync()) ([bool]) | Out-Null
                }
                elseif ($cmd -like "seek:*") {
                    $sec = [double]($cmd.Split(":")[1])
                    $ticks = [long]($sec * 10000000)
                    Await ($session.TryChangePlaybackPositionAsync($ticks)) ([bool]) | Out-Null
                }
                Start-Sleep -Milliseconds 150
                $forceUpdate = $true
            }
        }
        catch {}
    }

    # Kirim update ke Electron setiap ~600ms atau sesaat setelah tombol diklik
    if ($forceUpdate -or ($tick % 3 -eq 0)) {
        if ($null -ne $session) {
            $props = Await ($session.TryGetMediaPropertiesAsync()) $tProps
            $playback = $session.GetPlaybackInfo()
            $timeline = $session.GetTimelineProperties()

            $title = if ($props -and $props.Title) { $props.Title } else { "Tidak ada judul" }
            $artist = if ($props -and $props.Artist) { $props.Artist } else { "Artis tidak diketahui" }
            $isPlaying = ($playback -and $playback.PlaybackStatus.ToString() -eq "Playing")

            $pos = 0
            $dur = 1
            if ($null -ne $timeline) {
                $pos = $timeline.Position.TotalSeconds
                $dur = $timeline.EndTime.TotalSeconds
                if ($isPlaying -and $timeline.LastUpdatedTime.Year -gt 2000) {
                    $elapsed = ([DateTimeOffset]::UtcNow - $timeline.LastUpdatedTime).TotalSeconds
                    if ($elapsed -ge 0 -and $elapsed -lt 3600) {
                        $pos = [Math]::Min($dur, $pos + $elapsed)
                    }
                }
            }

            # Ekstrak Cover Art saat lagu berganti
            $currentKey = "$title|$artist"
            if ($currentKey -ne $lastTrackKey) {
                $cachedThumbnail = $null
                if ($props -and $null -ne $props.Thumbnail) {
                    try {
                        $streamRef = Await ($props.Thumbnail.OpenReadAsync()) $tStream
                        if ($null -ne $streamRef) {
                            $netStream = [System.IO.WindowsRuntimeStreamExtensions]::AsStreamForRead($streamRef)
                            $memStream = New-Object System.IO.MemoryStream
                            $netStream.CopyTo($memStream)
                            $bytes = $memStream.ToArray()
                            if ($bytes.Length -gt 0) {
                                $cachedThumbnail = "data:image/jpeg;base64," + [Convert]::ToBase64String($bytes)
                            }
                            $memStream.Dispose()
                            $netStream.Dispose()
                            $streamRef.Dispose()
                        }
                    }
                    catch {
                        $cachedThumbnail = $null
                    }
                }
                $lastTrackKey = $currentKey
            }

            $payload = @{
                hasMedia  = $true
                title     = $title
                artist    = $artist
                isPlaying = [bool]$isPlaying
                position  = [int][Math]::Floor([Math]::Max(0, $pos))
                duration  = [int][Math]::Floor([Math]::Max(1, $dur))
                thumbnail = $cachedThumbnail
            } | ConvertTo-Json -Compress

            [Console]::Out.WriteLine($payload)
            [Console]::Out.Flush()
        }
        else {
            $payload = @{ hasMedia = $false } | ConvertTo-Json -Compress
            [Console]::Out.WriteLine($payload)
            [Console]::Out.Flush()
        }
    }

    $tick++
    Start-Sleep -Milliseconds 200
}