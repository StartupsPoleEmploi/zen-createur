exports.up = async function up(knex) {
  await knex.schema.table('declaration_revenues', (table) => {
    table.string('status').defaultTo(null);
  });
};

exports.down = async function down(knex) {
  knex.schema.table('declaration_revenues', (table) => {
    table.dropColumn('status');
  });
};
