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

function configToConfigFile(config: Config): string {
  return [
    `GESTION_DES_PLANS=${booleanToConfigValue(config.hasGestionPlan)}`,
    `POPUP_DE_STOP=${booleanToConfigValue(config.hasStopPopups)}`,
    `ACCES_PAGE_GESTION=${booleanToConfigValue(config.hasGestionPage)}`,
    `ACCESS_PAGE_GESCOM=${booleanToConfigValue(config.hasGescomPage)}`,
    `ACCESS_PAGE_PRODUCTION=${booleanToConfigValue(config.hasProductionPage)}`,
    `ACCESS_PAGE_STATISTIQUES=${booleanToConfigValue(config.hasStatsPage)}`,
    `ACCESS_PAGE_RAPPORTS=${booleanToConfigValue(config.hasRapportPage)}`,
  ].join('\r\n');
}

function configFileToConfig(configFile: string): Config {
  const values = new Map<string, boolean>();
  configFile.split('\r\n').forEach(line => {
    const fragments = line.split('=');
    if (fragments.length === 2) {
      const [name, value] = fragments;
      values.set(name, configValueToBoolean(value));
    }
  });
  const getValue = (name: string): boolean => values.get(name) || false;
  return {
    hasGestionPlan: getValue('GESTION_DES_PLANS'),
    hasStopPopups: getValue('POPUP_DE_STOP'),
    hasGestionPage: getValue('ACCES_PAGE_GESTION'),
    hasGescomPage: getValue('ACCESS_PAGE_GESCOM'),
    hasProductionPage: getValue('ACCESS_PAGE_PRODUCTION'),
    hasStatsPage: getValue('ACCESS_PAGE_STATISTIQUES'),
    hasRapportPage: getValue('ACCESS_PAGE_RAPPORTS'),
  };
}

// console.log(app.getPath('userData'));
