exports.up = async function up(knex) {
  await knex.schema.table('declaration_revenues', (table) => {
    table.timestamp('createdAt').defaultTo(knex.fn.now())
    table.timestamp('updatedAt').defaultTo(knex.fn.now())
  });
};

exports.down = async function down(knex) {
  await knex.schema.table('declaration_revenues', (table) => {
    table.dropColumn('createdAt');
    table.dropColumn('updatedAt');
  });
};
