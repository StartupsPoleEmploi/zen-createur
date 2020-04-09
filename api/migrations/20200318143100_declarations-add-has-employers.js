exports.up = async function up(knex) {
  await knex.schema.table('declarations', (table) => {
    table.boolean('hasEmployers').defaultTo(false);
  });
};

exports.down = async function down(knex) {
  knex.schema.table('declarations', (table) => {
    table.dropColumn('hasEmployers');
  });
};
