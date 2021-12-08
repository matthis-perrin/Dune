import {app} from 'electron';
import * as fs from 'fs';
import path from 'path';

import {Config} from '@shared/models';

let config: Config = {
  hasGestionPlan: true,
  hasStopPopups: false,
  hasGestionPage: true,
  hasGescomPage: true,
  hasProductionPage: true,
  hasStatsPage: true,
  hasRapportPage: true,
  pdfPath: path.join(
    'C:',
    'Program Files (x86)',
    'Adobe',
    'Acrobat Reader DC',
    'Reader',
    'AcroRd32.exe'
  ),
};

export function getConfig(): Config {
  return config;
}

export async function loadConfig(): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const configPath = path.join(app.getPath('userData'), 'config_audric_windows.txt');
    console.log(configPath);
    fs.exists(configPath, exists => {
      if (!exists) {
        fs.writeFile(configPath, configToConfigFile(config), () => {
          resolve();
        });
      } else {
        fs.readFile(configPath, (err, data) => {
          if (err) {
            reject(err);
          } else {
            config = configFileToConfig(data.toString());
            resolve();
          }
        });
      }
    });
  });
}

function booleanToConfigValue(boolValue: boolean): string {
  return boolValue ? '1' : '0';
}

function configValueToBoolean(configValue: string): boolean {
  return configValue !== '0';
}

function configToConfigFile(c: Config): string {
  return [
    `GESTION_DES_PLANS=${booleanToConfigValue(c.hasGestionPlan)}`,
    `POPUP_DE_STOP=${booleanToConfigValue(c.hasStopPopups)}`,
    `ACCES_PAGE_GESTION=${booleanToConfigValue(c.hasGestionPage)}`,
    `ACCESS_PAGE_GESCOM=${booleanToConfigValue(c.hasGescomPage)}`,
    `ACCESS_PAGE_PRODUCTION=${booleanToConfigValue(c.hasProductionPage)}`,
    `ACCESS_PAGE_STATISTIQUES=${booleanToConfigValue(c.hasStatsPage)}`,
    `ACCESS_PAGE_RAPPORTS=${booleanToConfigValue(c.hasRapportPage)}`,
    `PDF_PATH=${c.pdfPath}`,
  ].join('\r\n');
}

function configFileToConfig(configFile: string): Config {
  const values = new Map<string, string>();
  configFile.split(/\r?\n/g).forEach(line => {
    const fragments = line.split('=');
    if (fragments.length === 2) {
      const [name, value] = fragments;
      values.set(name, value);
    }
  });
  console.log(values);
  const getBoolValue = (name: string): boolean => configValueToBoolean(values.get(name) ?? '0');
  return {
    hasGestionPlan: getBoolValue('GESTION_DES_PLANS'),
    hasStopPopups: getBoolValue('POPUP_DE_STOP'),
    hasGestionPage: getBoolValue('ACCES_PAGE_GESTION'),
    hasGescomPage: getBoolValue('ACCESS_PAGE_GESCOM'),
    hasProductionPage: getBoolValue('ACCESS_PAGE_PRODUCTION'),
    hasStatsPage: getBoolValue('ACCESS_PAGE_STATISTIQUES'),
    hasRapportPage: getBoolValue('ACCESS_PAGE_RAPPORTS'),
    pdfPath: values.get('PDF_PATH') ?? '',
  };
}

// console.log(app.getPath('userData'));
