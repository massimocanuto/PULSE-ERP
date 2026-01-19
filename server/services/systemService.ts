import { exec } from "child_process";

export const systemService = {
    setSystemVolume: (percent: number) => {
        // Normalize 0-100 to 0-50 clicks (each click is ~2%)
        const clicks = Math.round(Math.max(0, Math.min(100, percent)) / 2);

        // PowerShell command
        // 1. Instantiate WScript.Shell
        // 2. Send 50 VolDown (Reset to 0)
        // 3. Send 'clicks' VolUp
        const psCommand = `
      $obj = New-Object -ComObject WScript.Shell;
      1..50 | % { $obj.SendKeys([char]174) };
      if (${clicks} -gt 0) {
        1..${clicks} | % { $obj.SendKeys([char]175) };
      }
    `;

        // Remove newlines to avoid exec issues
        const flatCommand = psCommand.replace(/\s+/g, ' ').trim();
        const command = `powershell -NoProfile -ExecutionPolicy Bypass -Command "${flatCommand}"`;

        exec(command, (error) => {
            if (error) {
                console.error("Failed to set system volume:", error);
            } else {
                console.log(`System volume set to ~${percent}% (${clicks} steps)`);
            }
        });
    }
};
