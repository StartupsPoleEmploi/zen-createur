exports.up = async function up(knex) {
  await knex.schema.table('declarations', (table) => {
    table.string('status').defaultTo(null);
  });
};

exports.down = async function down(knex) {
  knex.schema.table('declarations', (table) => {
    table.dropColumn('status');
  });
};
