exports.up = async function up(knex) {
  await knex.schema.table('declaration_revenues', (table) => {
    table.dropColumn('revenue');
  });
  await knex.schema.table('declaration_revenues', (table) => {
    table.dropColumn('documentId');
  });
  await knex.schema.table('declaration_revenues', (table) => {
    table.integer('turnover').defaultTo(null);
  });
};

exports.down = async function down(knex) {
};
