exports.up = async function up(knex) {
  await knex.schema.table('declaration_revenues', (table) => {
    table.dropColumn('userId');
  });
};

exports.down = async function down(knex) {
};
