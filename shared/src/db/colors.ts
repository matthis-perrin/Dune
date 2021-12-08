import knex from 'knex';

import {COLORS_TABLE_NAME} from '@shared/db/table_names';
import {Color} from '@shared/models';
import {asMap, asString, asNumber} from '@shared/type_utils';

export const ColorsColumn = {
  REF_COLUMN: 'ref',
  NAME_COLUMN: 'name',
  BACKGROUND_HEX_COLUMN: 'background_hex',
  TEXT_HEX_COLUMN: 'text_hex',
  CLOSE_HEX_COLUMN: 'close_hex',
  HAS_BORDER_COLUMN: 'has_border',
  DESCRIPTION_COLUMN: 'description',
};

export async function createColorsTable(db: knex): Promise<void> {
  const hasTable = await db.schema.hasTable(COLORS_TABLE_NAME);
  if (!hasTable) {
    await db.schema.createTable(COLORS_TABLE_NAME, table => {
      table.string(ColorsColumn.REF_COLUMN).notNullable().primary();
      table.string(ColorsColumn.NAME_COLUMN).notNullable();
      table.string(ColorsColumn.BACKGROUND_HEX_COLUMN).notNullable();
      table.string(ColorsColumn.TEXT_HEX_COLUMN).notNullable();
      table.string(ColorsColumn.CLOSE_HEX_COLUMN).notNullable();
      table.integer(ColorsColumn.HAS_BORDER_COLUMN).notNullable();
      table.string(ColorsColumn.DESCRIPTION_COLUMN).notNullable();
    });
  }
}

export async function listColors(db: knex): Promise<Color[]> {
  return db(COLORS_TABLE_NAME)
    .select()
    .map(colorLine => {
      const c = asMap(colorLine);
      return {
        ref: asString(c[ColorsColumn.REF_COLUMN], ''),
        name: asString(c[ColorsColumn.NAME_COLUMN], ''),
        backgroundHex: asString(c[ColorsColumn.BACKGROUND_HEX_COLUMN], ''),
        textHex: asString(c[ColorsColumn.TEXT_HEX_COLUMN], ''),
        closeHex: asString(c[ColorsColumn.CLOSE_HEX_COLUMN], ''),
        hasBorder: asNumber(c[ColorsColumn.HAS_BORDER_COLUMN], 0) !== 0,
        description: asString(c[ColorsColumn.DESCRIPTION_COLUMN], ''),
      };
    });
}
