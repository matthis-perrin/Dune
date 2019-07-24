import * as log from 'electron-log';
import knex from 'knex';

import {SQLITE_DB} from '@root/db';
import {addError} from '@root/state';

import {createBobinesFillesTable} from '@shared/db/bobines_filles';
import {createBobinesMeresTable} from '@shared/db/bobines_meres';
import {createBobinesQuantitiesTable} from '@shared/db/bobines_quantities';
import {createCadencierTable} from '@shared/db/cadencier';
import {createClichesTable} from '@shared/db/cliches';
import {createColorsTable} from '@shared/db/colors';
import {
  createGescomSyncTable,
  getGescomSyncData,
  updateGescomSyncData,
} from '@shared/db/gescom_sync';
import {createOperationsTable} from '@shared/db/operations';
import {createPerfosTable} from '@shared/db/perfos';
import {createPlansProductionTable} from '@shared/db/plan_production';
import {createRefentesTable} from '@shared/db/refentes';
import {createSpeedHoursTable} from '@shared/db/speed_hours';
import {createSpeedMinutesTable} from '@shared/db/speed_minutes';
import {createSpeedProdsTable} from '@shared/db/speed_prods';
import {createSpeedStopsTable} from '@shared/db/speed_stops';
import {createStocksTable} from '@shared/db/stocks';
import {createCleaningTable} from '@shared/db/cleanings';
import {createUnplannedStopTable} from '@shared/db/unplanned_stops';
import {createProdHoursTable} from '@shared/db/prod_hours';

export async function setupSqliteDB(): Promise<void> {
  await Promise.all([
    createBobinesFillesTable(SQLITE_DB.Gescom),
    createBobinesMeresTable(SQLITE_DB.Gescom),
    createClichesTable(SQLITE_DB.Gescom),
    createStocksTable(SQLITE_DB.Gescom),
    createGescomSyncTable(SQLITE_DB.Gescom),
    createCadencierTable(SQLITE_DB.Gescom),

    createPerfosTable(SQLITE_DB.Params),
    createRefentesTable(SQLITE_DB.Params),
    createOperationsTable(SQLITE_DB.Params),
    createBobinesQuantitiesTable(SQLITE_DB.Params),
    createColorsTable(SQLITE_DB.Params),
    createUnplannedStopTable(SQLITE_DB.Params),
    createCleaningTable(SQLITE_DB.Params),
    createProdHoursTable(SQLITE_DB.Params),

    createPlansProductionTable(SQLITE_DB.Prod),

    createSpeedMinutesTable(SQLITE_DB.Prod),
    createSpeedHoursTable(SQLITE_DB.Prod),
    createSpeedStopsTable(SQLITE_DB.Prod),
    createSpeedProdsTable(SQLITE_DB.Prod),
  ]);
}

// TABLE NAMES

export const ARTICLE_TABLE_NAME = 'F_ARTICLE';
export const GESCOM_STOCK_TABLE_NAME = 'F_ARTSTOCK';
export const GESCOM_CADENCIER_TABLE_NAME = 'F_DOCLIGNE';

// COLUMN NAMES

export const LAST_UPDATE_COLUMN = 'cbModification';

export const ARTICLE_REF_COLUMN = 'AR_Ref';
export const ARTICLE_DESIGNATION_COLUMN = 'AR_Design';
export const ARTICLE_DESIGNATION_OPERATOR_COLUMN = 'Désignation';
export const ARTICLE_LAIZE_COLUMN = 'Largeur';
export const ARTICLE_LONGUEUR_COLUMN = 'Longueur';
export const ARTICLE_COULEUR_PAPIER_COLUMN = 'Couleur papier';
export const ARTICLE_GRAMMAGE_COLUMN = 'Grammage papier';
export const ARTICLE_REF_CLICHE_1_COLUMN = "Code cliche attaché à l'article";
export const ARTICLE_REF_CLICHE_2_COLUMN = 'Code cliché attaché article 2';
export const ARTICLE_TYPE_IMPRESSION_COLUMN = 'Impression Type';
export const ARTICLE_LONGUEUR_BM_COLUMN = 'Longueur BM';
export const ARTICLE_NOMBRE_POSES_A_COLUMN = 'NB de pose A';
export const ARTICLE_NOMBRE_POSES_B_COLUMN = 'NB de pose B';
export const ARTICLE_NOMBRE_POSES_C_COLUMN = 'NB de pose C';
export const ARTICLE_NOMBRE_POSES_D_COLUMN = 'NB de pose D';
export const ARTICLE_COULEUR_1_COLUMN = 'Couleur 1';
export const ARTICLE_COULEUR_2_COLUMN = 'Couleur 2';
export const ARTICLE_COULEUR_3_COLUMN = 'Couleur 3';
export const ARTICLE_COULEUR_4_COLUMN = 'Couleur 4';
export const ARTICLE_COULEUR_5_COLUMN = 'Couleur 5';
export const ARTICLE_COULEUR_6_COLUMN = 'Couleur 6';
export const ARTICLE_IMPORTANCE_ORDER_COULEURS_COLUMN = 'Importanc ordre couleur OUI/NON';
export const ARTICLE_SOMMEIL_COLUMN = 'AR_Sommeil';

export const STOCK_NUM_DEPOT = 'DE_No';
export const STOCK_REEL = 'AS_QteSto';
export const STOCK_COMMANDE = 'AS_QteCom';
export const STOCK_RESERVE = 'AS_QteRes';

export const VENTE_QUANTITE_COLUMN = 'DL_Qte';
export const VENTE_QUANTITE_DATE_COLUMN = 'DO_Date';
export const VENTE_DOCUMENT_TYPE_COLUMN = 'DO_Type';
export const VENTE_REF = 'DL_No';
export const DOCUMENT_TYPE_COMMANDE = 1;
export const DOCUMENT_TYPE_LIVRAISON = 3;
export const DOCUMENT_TYPE_FACTURE = 6;
export const DOCUMENT_TYPE_FACTURE_COMPTABILISEE = 7;

export abstract class GescomWatcher {
  protected abstract tableName: string;
  protected BATCH_SIZE_INSERT = 50;
  protected WAIT_ON_ERROR_MS = 250;
  protected WAIT_WHEN_NO_NEW_CHANGE_MS = 1000;
  protected MIN_LINES_FOR_NO_WAIT_AFTER_INSERT = 5;

  constructor(protected readonly gescomDB: knex, protected readonly sqliteDB: knex) {}

  public async start(): Promise<void> {
    this.fetchNextBatch();
  }

  private hasPossiblyChanged(gescomDate: Date, lastCheckDate: Date): boolean {
    // Gescom date is actually incorrect. The "raw" value of the date is the right
    // one, but without timezone info. So we need to add to the time the equivalent
    // of the current timezone offset (we assume that the error was that the date are
    // inserted to the database as strings without timezone info and that SQL set one
    // by default).
    const convertedGescomDate = new Date(
      gescomDate.getTime() - gescomDate.getTimezoneOffset() * 60 * 1000
    );
    const convertedGescomDateRounded = convertedGescomDate.setSeconds(0, 0);
    const lastCheckDateRounded = lastCheckDate.setSeconds(0, 0);

    return Math.abs(lastCheckDateRounded - convertedGescomDateRounded) <= 60 * 1000;
  }

  // tslint:disable-next-line:no-any
  private async insertBatch(localDate: Date, lines: any[], offset: number = 0): Promise<void> {
    if (offset >= lines.length) {
      return Promise.resolve();
    }
    return new Promise<void>((resolve, reject) => {
      const chunk = lines.slice(offset, offset + this.BATCH_SIZE_INSERT);
      // tslint:disable-next-line:no-any
      const refs = chunk.map((l: any) => this.getRef(l));
      this.deleteRefs(refs)
        .then(() => {
          this.sqliteDB(this.tableName)
            .insert(chunk.map(l => this.mapGescomLineToSqliteLine(localDate, l)))
            .then(() => {
              log.info(
                `Inserted ${offset + chunk.length}/${lines.length} line in the SQLite table ${
                  this.tableName
                }.`
              );
              this.insertBatch(localDate, lines, offset + this.BATCH_SIZE_INSERT)
                .then(resolve)
                .catch(reject);
            })
            .catch(err => {
              addError(
                `Erreur lors de l'insertion de ${chunk.length} ligne(s) dans la table ${
                  this.tableName
                }. Réessaie dans ${this.WAIT_ON_ERROR_MS}ms.`,
                err.toString()
              );
              setTimeout(() => this.insertBatch(localDate, lines, offset), this.WAIT_ON_ERROR_MS);
            });
        })
        .catch((err: any) => {
          addError(
            `Erreur lors de la suppression de ${chunk.length} ligne(s) dans la table ${
              this.tableName
            }. Réessaie dans ${this.WAIT_ON_ERROR_MS}ms.`,
            err.toString()
          );
          setTimeout(() => this.insertBatch(localDate, lines, offset), this.WAIT_ON_ERROR_MS);
        });
    });
  }

  private fetchNextBatch() {
    getGescomSyncData(this.sqliteDB, this.tableName)
      .then(({lastChecked, lastUpdated}) => {
        const operator = this.hasPossiblyChanged(lastChecked, lastUpdated) ? '>=' : '>';
        const fetchQuery = this.fetch()
          .where(LAST_UPDATE_COLUMN, operator, lastUpdated)
          .orderBy(LAST_UPDATE_COLUMN);
        const queryTime = new Date();

        fetchQuery
          .then((lines: any) => {
            // log.info(
            //   `Fetched ${lines.length} for ${
            //     this.tableName
            //   } with ${operator} (lastChecked=${lastChecked}, lastUpdated=${lastUpdated})`
            // );
            if (lines.length > 0) {
              this.insertBatch(queryTime, lines)
                .then(() => {
                  const lastLine = lines[lines.length - 1];
                  const newLastUpdated = lastLine[LAST_UPDATE_COLUMN];
                  updateGescomSyncData(this.sqliteDB, this.tableName, newLastUpdated, queryTime)
                    .then(() => {
                      // When we detect a change, we need to keep inserting it in the database for around a minute
                      // because the GESCOM "last update" field is rounded to the minute. So we have no way to know if
                      // the data has changed again.
                      // But most of the time there is nothing to really update, so we still want to wait until fetching the
                      // next batch to not query the GESCOM too much. So if we are not inserting too many rows, it's likely we
                      // are in this case and not in a "big update phase".
                      const wait =
                        lines.length >= this.MIN_LINES_FOR_NO_WAIT_AFTER_INSERT
                          ? 0
                          : this.WAIT_WHEN_NO_NEW_CHANGE_MS;
                      setTimeout(() => {
                        this.fetchNextBatch();
                      }, wait);
                    })
                    .catch(err => {
                      addError(
                        `Erreur lors de la mise à jour de la table de synchronisation pour la table ${
                          this.tableName
                        }. Ignoré, mais délais la prochaine requête de ${this.WAIT_ON_ERROR_MS}ms.`,
                        err.toString()
                      );
                      setTimeout(() => this.fetchNextBatch(), this.WAIT_ON_ERROR_MS);
                    });
                })
                .catch(err => {
                  addError('This error should never happen', err.toString());
                });
            } else {
              updateGescomSyncData(this.sqliteDB, this.tableName, lastUpdated, queryTime)
                .then(() => this.fetchNextBatch())
                .catch(err => {
                  addError(
                    `Erreur lors de la mise à jour de la table de synchronisation pour la table ${
                      this.tableName
                    }. Ignoré, mais délais la prochaine requête de ${this.WAIT_ON_ERROR_MS}ms.`,
                    err.toString()
                  );
                  setTimeout(() => this.fetchNextBatch(), this.WAIT_ON_ERROR_MS);
                });
            }
          })
          .catch(err => {
            addError(
              `Erreur lors de la récupération des ${this.tableName}. Réessaie dans ${
                this.WAIT_ON_ERROR_MS
              }ms.`,
              err.toString()
            );
            setTimeout(() => this.fetchNextBatch(), this.WAIT_ON_ERROR_MS);
          });
      })
      .catch(err => {
        addError(
          `Erreur lors de la récupération des données de syncronisation pour la table ${
            this.tableName
          }. Réessaie dans ${this.WAIT_ON_ERROR_MS}ms.`,
          err.toString()
        );
        setTimeout(() => this.fetchNextBatch(), this.WAIT_ON_ERROR_MS);
      });
  }

  protected createRandomUnknownRef(): string {
    return `INCONNU-${Math.random()
      .toString(36)
      .substr(2)
      .toUpperCase()}`;
  }

  protected abstract fetch(): knex.QueryBuilder;
  protected abstract mapGescomLineToSqliteLine(localDate: Date, gescomLine: any): any;
  protected abstract deleteRefs(refs: string[]): Promise<void>;
  protected abstract getRef(gescomLine: any): string;
}
