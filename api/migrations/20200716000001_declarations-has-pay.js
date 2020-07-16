exports.up = async function up(knex) {
  await knex.schema.table('declarations', (table) => {
    table.boolean('hasPay').defaultTo(null);
  });
};

exports.down = async function down(knex) {
  knex.schema.table('declarations', (table) => {
    table.dropColumn('hasPay');
  });
};
