import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';

export async function tryConvertToPdfWithGhostscript(inputPath: string, outputPdfPath: string): Promise<boolean> {
  return new Promise((resolve) => {
    const gs = spawn(
      'gs',
      ['-dNOPAUSE', '-dBATCH', '-sDEVICE=pdfwrite', `-sOutputFile=${outputPdfPath}`, inputPath],
      { stdio: 'ignore' },
    );
    gs.on('error', () => resolve(false));
    gs.on('close', async (code) => {
      if (code !== 0) {
        resolve(false);
        return;
      }
      try {
        const st = await fs.stat(outputPdfPath);
        resolve(st.size > 0);
      } catch {
        resolve(false);
      }
    });
  });
}
